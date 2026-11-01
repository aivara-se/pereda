package se.aivara.pereda.data

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * The log and the live write: today at the top, older days behind it, and every
 * keystroke on its way to the database.
 *
 * The class is the app's state machine, and it holds no Android type: the store
 * and the clock are injected, so the debounce, the one-save-in-flight rule, the
 * stale counter and the midnight line are all tested on the JVM.
 */
class NoteLog(
    private val open: () -> Notes,
    private val scope: CoroutineScope,
    private val io: CoroutineDispatcher = Dispatchers.IO,
    private val clock: () -> String = Day::today,
    private val debounceMillis: Long = 300,
) {
    /** A save that did not land, and why; it outranks every other status line. */
    data class Failure(val day: String, val message: String)

    data class State(
        val ready: Boolean = false,
        val fatal: String? = null,
        val today: String = "",
        val anchor: String = "",
        val entries: List<Note> = emptyList(),
        val open: Note? = null,
        val more: Boolean = false,
        val loading: Boolean = false,
        val failure: Failure? = null,
        val logError: String? = null,
        val notice: String? = null,
    )

    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state.asStateFlow()

    private var store: Notes? = null
    private val pending = mutableMapOf<String, String>()
    private val timers = mutableMapOf<String, Job>()
    private val runners = mutableMapOf<String, Job>()

    init {
        _state.update { it.copy(today = clock()) }
    }

    /** Open the store and read the first page; a store that cannot be opened becomes the fatal screen. */
    fun start() {
        if (store != null) return
        scope.launch {
            val opened = try {
                withContext(io) { open() }
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                _state.update {
                    it.copy(ready = true, fatal = error.message ?: "Pereda could not open its notes.")
                }
                return@launch
            }
            store = opened
            load()
        }
    }

    /** The Today path: every entry is flushed before the log is read again. */
    suspend fun goToday() {
        flushAll()
        load()
    }

    /**
     * Re-read the clock. A log left open past midnight keeps its day and says
     * where the text is going; nothing moves until [goToday].
     */
    fun refreshDay() {
        val now = clock()
        _state.update { state ->
            val behind = state.anchor.isNotEmpty() && state.anchor < now
            state.copy(
                today = now,
                notice = if (behind) {
                    "Writing to ${Day.notice(state.anchor, now)} — today is ${Day.notice(now, now)}."
                } else {
                    null
                },
            )
        }
    }

    /** The body changed on screen: show it now, write it after the debounce. */
    fun edit(day: String, body: String) {
        val current = noteFor(day) ?: return
        if (current.body == body) return
        put(current.copy(body = body))
        pending[day] = body
        timers.remove(day)?.cancel()
        timers[day] = scope.launch {
            delay(debounceMillis)
            flush(day)
        }
    }

    /** The days before the oldest one loaded, newest first. */
    fun loadOlder() {
        val notes = store ?: return
        val snapshot = _state.value
        if (!snapshot.ready || !snapshot.more || snapshot.loading || snapshot.entries.isEmpty()) return
        _state.update { it.copy(loading = true) }
        scope.launch {
            try {
                val before = snapshot.entries.last().day
                val rows = withContext(io) { notes.page(before, PAGE + 1) }
                _state.update { state ->
                    val known = state.entries.mapTo(HashSet()) { it.day }
                    state.copy(
                        entries = state.entries + rows.take(PAGE).filter { it.day !in known },
                        more = rows.size > PAGE,
                        loading = false,
                        logError = null,
                    )
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                _state.update {
                    it.copy(loading = false, logError = "Could not load older days — ${error.reason()}")
                }
            }
        }
    }

    /** Read one day for its own screen, flushing what is on screen first. */
    suspend fun openDay(day: String) {
        flushAll()
        val notes = store ?: return
        val note = noteFor(day) ?: try {
            withContext(io) { notes.note(day) }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            _state.update { it.copy(logError = "Could not open that day — ${error.reason()}") }
            return
        } ?: Note(day, "", 0)
        _state.update { it.copy(open = note) }
    }

    /** Leave a day screen; a day whose text was cleared leaves the log. */
    suspend fun closeDay() {
        flushAll()
        _state.update { state ->
            val open = state.open
            val drop = open != null && open.body.isEmpty() && open.day != state.anchor
            state.copy(
                open = null,
                entries = if (drop) state.entries.filterNot { it.day == open.day } else state.entries,
            )
        }
    }

    /** Delete asks once in the UI; here the day is written empty and the tombstone stays. */
    suspend fun delete(day: String) {
        flush(day)?.join()
        val notes = store ?: return
        val current = noteFor(day) ?: return
        try {
            val outcome = withContext(io) { notes.save(day, "", current.seq + 1) }
            when (outcome) {
                is SaveOutcome.Applied -> _state.update { state ->
                    if (day == state.anchor) {
                        state.copy(
                            entries = state.entries.map { if (it.day == day) outcome.note else it },
                            failure = if (state.failure?.day == day) null else state.failure,
                        )
                    } else {
                        state.copy(
                            entries = state.entries.filterNot { it.day == day },
                            open = state.open?.takeIf { it.day != day },
                            failure = if (state.failure?.day == day) null else state.failure,
                        )
                    }
                }

                SaveOutcome.Stale -> _state.update {
                    it.copy(failure = Failure(day, "This note was written somewhere else."))
                }
            }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            _state.update { it.copy(failure = Failure(day, error.reason())) }
        }
    }

    /** Days before today whose text holds every word of [query], newest first. */
    suspend fun search(query: String): List<SearchHit> {
        val notes = store ?: return emptyList()
        return try {
            withContext(io) { notes.search(query, _state.value.today) }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            _state.update { it.copy(logError = "Could not search — ${error.reason()}") }
            emptyList()
        }
    }

    /** Send everything waiting, for the Today path, a day opening and the app leaving. */
    suspend fun flushAll() {
        _state.value.entries.mapNotNull { flush(it.day) }.forEach { it.join() }
        _state.value.open?.let { flush(it.day)?.join() }
    }

    fun close() {
        val notes = store ?: return
        store = null
        runCatching { notes.close() }
    }

    /**
     * Start the day's save if one is not running, and return the run to await.
     * One save is in flight per entry; a newer body waits in [pending] and
     * replaces it, and is always sent whole.
     */
    private fun flush(day: String): Job? {
        timers.remove(day)?.cancel()
        if (!pending.containsKey(day)) return runners[day]
        return runners[day] ?: scope.launch { run(day) }.also { job ->
            runners[day] = job
            job.invokeOnCompletion { runners.remove(day, job) }
        }
    }

    private suspend fun run(day: String) {
        try {
            while (true) {
                val body = pending.remove(day) ?: break
                val notes = store ?: break
                val current = noteFor(day) ?: break
                val outcome = withContext(io) { notes.save(day, body, current.seq + 1) }
                when (outcome) {
                    is SaveOutcome.Applied -> {
                        put(outcome.note)
                        if (_state.value.failure?.day == day) _state.update { it.copy(failure = null) }
                    }

                    SaveOutcome.Stale -> {
                        _state.update {
                            it.copy(failure = Failure(day, "This note was written somewhere else."))
                        }
                        break
                    }
                }
            }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            _state.update { it.copy(failure = Failure(day, error.reason())) }
        }
    }

    private suspend fun load() {
        val notes = store ?: return
        val today = clock()
        try {
            val rows = withContext(io) { notes.page(Day.plusDays(today, 1), PAGE + 1) }
            val current = withContext(io) { notes.note(today) } ?: Note(today, "", 0)
            _state.update {
                it.copy(
                    ready = true,
                    fatal = null,
                    today = today,
                    anchor = today,
                    entries = listOf(current) + rows.take(PAGE).filter { row -> row.day != today },
                    open = null,
                    more = rows.size > PAGE,
                    loading = false,
                    failure = null,
                    logError = null,
                    notice = null,
                )
            }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            _state.update {
                it.copy(
                    ready = true,
                    fatal = "Pereda could not read the notes at ${notes.path}: ${error.reason()}",
                )
            }
        }
    }

    private fun noteFor(day: String): Note? {
        val snapshot = _state.value
        if (snapshot.open?.day == day) return snapshot.open
        return snapshot.entries.firstOrNull { it.day == day }
    }

    private fun put(note: Note) {
        _state.update { state ->
            state.copy(
                entries = state.entries.map { if (it.day == note.day) note else it },
                open = if (state.open?.day == note.day) note else state.open,
            )
        }
    }

    private fun Throwable.reason(): String = message ?: this::class.simpleName ?: "it failed"

    companion object {
        /** How many days one page of the log holds. */
        const val PAGE = 30
    }
}
