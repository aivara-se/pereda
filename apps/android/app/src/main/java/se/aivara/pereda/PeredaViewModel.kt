package se.aivara.pereda

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import se.aivara.pereda.data.NoteLog
import se.aivara.pereda.data.NotesStore
import se.aivara.pereda.data.SearchHit

/** Where the app is: the log, the search, or one day on its own screen. */
sealed interface Screen {
    data object Log : Screen

    data object Search : Screen

    data class Day(val day: String) : Screen
}

/**
 * The app's two flows and its navigation.
 *
 * The notes themselves live in [NoteLog]; this class only decides which screen
 * is drawn, what the search field holds, and where back goes.
 */
class PeredaViewModel(application: Application) : AndroidViewModel(application) {
    private val path = application.getDatabasePath(NotesStore.FILE).absolutePath

    val log = NoteLog(open = { NotesStore.open(path) }, scope = viewModelScope)

    data class Ui(
        val screen: Screen = Screen.Log,
        val query: String = "",
        val results: List<SearchHit> = emptyList(),
        val searching: Boolean = false,
        val searched: Boolean = false,
        val dayReturn: Screen = Screen.Log,
    )

    private val _ui = MutableStateFlow(Ui())
    val ui: StateFlow<Ui> = _ui.asStateFlow()

    private var searchJob: Job? = null

    init {
        log.start()
    }

    /** The app came forward: the clock may have crossed midnight while it was away. */
    fun onResume() = log.refreshDay()

    /** The app left the screen: every edit inside the debounce is written now. */
    fun onStop() {
        viewModelScope.launch { log.flushAll() }
    }

    fun edit(day: String, body: String) = log.edit(day, body)

    fun loadOlder() = log.loadOlder()

    /** Today flushes every entry before it reloads, so no text is lost to the move. */
    fun goToday() {
        viewModelScope.launch {
            log.goToday()
            _ui.update { it.copy(screen = Screen.Log, query = "", results = emptyList(), searched = false) }
        }
    }

    fun openDay(day: String) {
        viewModelScope.launch {
            log.openDay(day)
            // A day that could not be read leaves the log where it was; the
            // status line already says why.
            if (log.state.value.open?.day != day) return@launch
            _ui.update {
                it.copy(screen = Screen.Day(day), dayReturn = if (it.screen is Screen.Search) Screen.Search else Screen.Log)
            }
        }
    }

    fun back() {
        when (_ui.value.screen) {
            Screen.Log -> Unit
            Screen.Search -> cancelSearch()
            is Screen.Day -> viewModelScope.launch {
                log.closeDay()
                _ui.update { it.copy(screen = it.dayReturn) }
            }
        }
    }

    fun delete(day: String) {
        viewModelScope.launch {
            val screen = _ui.value.screen
            log.delete(day)
            if (screen is Screen.Day && screen.day == day) {
                val back = _ui.value.dayReturn
                _ui.update { it.copy(screen = back) }
                // The deleted day must not stay in results that are still on screen.
                if (back is Screen.Search && _ui.value.query.isNotBlank()) setQuery(_ui.value.query)
            }
        }
    }

    fun openSearch() {
        _ui.update { it.copy(screen = Screen.Search, query = "", results = emptyList(), searched = false, searching = false) }
    }

    /** Closing the search returns to the log at today, as the desktop does. */
    fun cancelSearch() {
        viewModelScope.launch {
            log.goToday()
            _ui.update { it.copy(screen = Screen.Log, query = "", results = emptyList(), searched = false, searching = false) }
        }
    }

    /** A word is matched as a prefix; every word must be there, in any order. */
    fun setQuery(text: String) {
        _ui.update { it.copy(query = text) }
        searchJob?.cancel()
        if (text.isBlank()) {
            _ui.update { it.copy(results = emptyList(), searching = false, searched = false) }
            return
        }
        searchJob = viewModelScope.launch {
            delay(SEARCH_DEBOUNCE)
            _ui.update { it.copy(searching = true) }
            val hits = log.search(text)
            _ui.update { it.copy(results = hits, searching = false, searched = true) }
        }
    }

    override fun onCleared() {
        log.close()
    }

    private companion object {
        const val SEARCH_DEBOUNCE = 120L
    }
}
