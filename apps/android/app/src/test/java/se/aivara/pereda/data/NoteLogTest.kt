package se.aivara.pereda.data

import java.io.IOException
import java.util.Locale
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * The live write and the log, with a store in memory and a clock under the
 * test's hand. This is where the debounce, the one-save-in-flight rule, the
 * tombstone, the midnight line and paging are pinned.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class NoteLogTest {
    private val dispatcher = StandardTestDispatcher()
    private var today = "2026-11-01"
    private lateinit var notes: FakeNotes

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        notes = FakeNotes()
    }

    @Test
    fun `the app opens on today, empty, above the days that have a note`() = runTest(dispatcher) {
        notes.seed(Note("2026-10-31", "yesterday", 1), Note("2026-10-30", "before that", 1))
        val log = log()

        log.start()
        advanceUntilIdle()

        val state = log.state.value
        assertTrue(state.ready)
        assertEquals("2026-11-01", state.anchor)
        assertEquals(listOf("2026-11-01", "2026-10-31", "2026-10-30"), state.entries.map { it.day })
        assertEquals("", state.entries.first().body)
    }

    @Test
    fun `a keystroke shows at once and reaches the store after the debounce`() = runTest(dispatcher) {
        val log = log()
        log.start()
        advanceUntilIdle()

        log.edit(today, "H")
        advanceTimeBy(200)

        assertEquals("H", log.state.value.entries.first().body)
        assertTrue(notes.saves.isEmpty())

        advanceTimeBy(120)
        advanceUntilIdle()

        assertEquals(listOf(Triple(today, "H", 1L)), notes.saves)
        assertEquals("H", notes.rows[today]?.body)
    }

    @Test
    fun `a whole body is written, and its counter is newer every time`() = runTest(dispatcher) {
        val log = log()
        log.start()
        advanceUntilIdle()

        log.edit(today, "a")
        advanceTimeBy(320)
        advanceUntilIdle()
        log.edit(today, "ab")
        advanceTimeBy(320)
        advanceUntilIdle()

        assertEquals(listOf(Triple(today, "a", 1L), Triple(today, "ab", 2L)), notes.saves)
        assertEquals("ab", log.state.value.entries.first().body)
        assertEquals(2L, log.state.value.entries.first().seq)
    }

    @Test
    fun `a failed save is shown and the text stays on screen`() = runTest(dispatcher) {
        val log = log()
        log.start()
        advanceUntilIdle()
        notes.failWith = IOException("No space left on device")

        log.edit(today, "kept on screen")
        advanceTimeBy(320)
        advanceUntilIdle()

        assertEquals("kept on screen", log.state.value.entries.first().body)
        assertEquals("No space left on device", log.state.value.failure?.message)
    }

    @Test
    fun `a save that loses the counter says the note was written somewhere else`() = runTest(dispatcher) {
        val log = log()
        log.start()
        advanceUntilIdle()
        notes.stale = true

        log.edit(today, "mine")
        advanceTimeBy(320)
        advanceUntilIdle()

        assertEquals("This note was written somewhere else.", log.state.value.failure?.message)
    }

    @Test
    fun `deleting today writes an empty body and keeps the day`() = runTest(dispatcher) {
        notes.seed(Note(today, "text", 3))
        val log = log()
        log.start()
        advanceUntilIdle()

        log.delete(today)
        advanceUntilIdle()

        val state = log.state.value
        assertEquals(listOf(today), state.entries.map { it.day })
        assertEquals("", state.entries.first().body)
        assertEquals(4L, state.entries.first().seq)
        assertEquals("", notes.rows[today]?.body)
    }

    @Test
    fun `deleting an older day takes it out of the log`() = runTest(dispatcher) {
        notes.seed(Note("2026-10-31", "yesterday", 1))
        val log = log()
        log.start()
        advanceUntilIdle()

        log.openDay("2026-10-31")
        log.delete("2026-10-31")
        advanceUntilIdle()

        assertEquals(listOf(today), log.state.value.entries.map { it.day })
        assertEquals("", notes.rows["2026-10-31"]?.body)
    }

    @Test
    fun `a cleared older day leaves the log when its screen closes`() = runTest(dispatcher) {
        notes.seed(Note("2026-10-31", "yesterday", 1))
        val log = log()
        log.start()
        advanceUntilIdle()

        log.openDay("2026-10-31")
        log.edit("2026-10-31", "")
        log.closeDay()
        advanceUntilIdle()

        assertEquals(listOf(today), log.state.value.entries.map { it.day })
        assertNull(log.state.value.open)
    }

    @Test
    fun `a log left open past midnight keeps its day and says so`() = runTest(dispatcher) {
        val log = log()
        log.start()
        advanceUntilIdle()

        today = "2026-11-02"
        log.refreshDay()

        assertEquals("2026-11-01", log.state.value.anchor)
        assertEquals(
            "Writing to 1 November — today is 2 November.",
            log.state.value.notice,
        )
    }

    @Test
    fun `today flushes what is on screen before it reloads`() = runTest(dispatcher) {
        val log = log()
        log.start()
        advanceUntilIdle()

        log.edit(today, "not yet written")
        log.goToday()

        assertEquals("not yet written", notes.rows[today]?.body)
        assertEquals("not yet written", log.state.value.entries.first().body)
    }

    @Test
    fun `the log pages thirty days at a time`() = runTest(dispatcher) {
        val days = (1..35).map { offset -> Note(Day.plusDays(today, -offset.toLong()), "day $offset", 1) }
        notes.seed(*days.toTypedArray())
        val log = log()
        log.start()
        advanceUntilIdle()

        assertEquals(31, log.state.value.entries.size)
        assertTrue(log.state.value.more)

        log.loadOlder()
        advanceUntilIdle()

        assertEquals(36, log.state.value.entries.size)
        assertFalse(log.state.value.more)
        assertEquals(Day.plusDays(today, -35), log.state.value.entries.last().day)
    }

    @Test
    fun `a store that cannot open is the fatal screen, not an empty log`() = runTest(dispatcher) {
        val log = NoteLog(
            open = { throw StoreUnavailable("Pereda could not open its notes at /data/pereda.db: file is not a database") },
            scope = this,
            io = dispatcher,
            clock = { today },
        )

        log.start()
        advanceUntilIdle()

        assertTrue(log.state.value.ready)
        assertEquals(
            "Pereda could not open its notes at /data/pereda.db: file is not a database",
            log.state.value.fatal,
        )
        assertTrue(log.state.value.entries.isEmpty())
    }

    private fun TestScope.log() = NoteLog(
        open = { notes },
        scope = this,
        io = dispatcher,
        clock = { today },
    )
}

/** The store in memory, with the SQL's rules: counters only move forward, and empty days keep their row. */
private class FakeNotes(initial: List<Note> = emptyList()) : Notes {
    override val path = "/data/pereda.db"

    val rows = initial.associateBy { it.day }.toMutableMap()
    val saves = mutableListOf<Triple<String, String, Long>>()
    var failWith: Exception? = null
    var stale = false

    fun seed(vararg notes: Note) {
        notes.forEach { rows[it.day] = it }
    }

    override fun note(day: String): Note? = rows[day]

    override fun save(day: String, body: String, seq: Long): SaveOutcome {
        saves += Triple(day, body, seq)
        failWith?.let { throw it }
        if (stale) return SaveOutcome.Stale
        val current = rows[day]
        if (current != null && seq <= current.seq) return SaveOutcome.Stale
        val note = Note(day, body, seq)
        rows[day] = note
        return SaveOutcome.Applied(note)
    }

    override fun page(before: String, limit: Int): List<Note> =
        rows.values
            .filter { it.body.isNotEmpty() && it.day < before }
            .sortedByDescending { it.day }
            .take(limit)

    override fun search(query: String, before: String): List<SearchHit> = emptyList()

    override fun close() = Unit
}
