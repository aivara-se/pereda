package se.aivara.pereda.data

/** One day's whole note, with the counter of the write that produced it. */
data class Note(
    val day: String,
    val body: String,
    val seq: Long,
)

/** A day found by a search, with the text around the first match. */
data class SearchHit(
    val day: String,
    val snippet: String,
)

/** One write's result: the row now stored, or a counter that lost. */
sealed interface SaveOutcome {
    data class Applied(val note: Note) : SaveOutcome

    /** A newer write is already stored; this body was not written. */
    data object Stale : SaveOutcome
}

/** The store, as the rest of the app sees it. Every call blocks on the disk. */
interface Notes : AutoCloseable {
    /** The file the notes live in, named when it cannot be opened. */
    val path: String

    fun note(day: String): Note?

    fun save(day: String, body: String, seq: Long): SaveOutcome

    fun page(before: String, limit: Int): List<Note>

    fun search(query: String, before: String): List<SearchHit>
}

/**
 * The database cannot be opened or is not the store this build reads.
 *
 * The message names the file and the reason; the app never creates a new file
 * over one it could not open.
 */
class StoreUnavailable(message: String) : Exception(message)
