package se.aivara.pereda.data

/**
 * The store's SQL, kept apart from the driver so it can be read, compared with
 * the desktop's `store.js`, and run against a plain SQLite in the tests.
 *
 * The schema is the desktop's, verbatim: one row per day keyed by the local
 * date, a tombstone instead of a delete, and an FTS5 index kept in step by
 * three triggers. The index is derived; `notes` stays the only authority.
 */
object NotesSql {
    /** The schema version this build reads and writes. */
    const val VERSION = 2

    /** A search never returns more days than this; the log is the way to the rest. */
    const val LIMIT = 50

    const val NOTES = """
        CREATE TABLE notes (
          day  TEXT PRIMARY KEY,
          body TEXT NOT NULL,
          seq  INTEGER NOT NULL
        ) WITHOUT ROWID;
    """

    /**
     * The index and its triggers. `remove_diacritics 0` is what keeps å, ä and
     * ö apart from a, a and o; `day` is unindexed because it is not searched.
     */
    const val INDEX = """
        CREATE VIRTUAL TABLE notes_fts USING fts5(
          day UNINDEXED,
          body,
          tokenize="unicode61 remove_diacritics 0"
        );
        CREATE TRIGGER notes_insert AFTER INSERT ON notes BEGIN
          INSERT INTO notes_fts (day, body) VALUES (new.day, new.body);
        END;
        CREATE TRIGGER notes_update AFTER UPDATE ON notes BEGIN
          DELETE FROM notes_fts WHERE day = old.day;
          INSERT INTO notes_fts (day, body) VALUES (new.day, new.body);
        END;
        CREATE TRIGGER notes_delete AFTER DELETE ON notes BEGIN
          DELETE FROM notes_fts WHERE day = old.day;
        END;
    """

    const val READ = "SELECT body, seq FROM notes WHERE day = ?"

    const val WRITE = """
        INSERT INTO notes (day, body, seq) VALUES (?, ?, ?)
        ON CONFLICT(day) DO UPDATE SET body = excluded.body, seq = excluded.seq
        WHERE excluded.seq > notes.seq
    """

    const val PAGE = """
        SELECT day, body, seq FROM notes
        WHERE body <> '' AND day < ?
        ORDER BY day DESC
        LIMIT ?
    """

    const val SEARCH = """
        SELECT notes.day AS day, snippet(notes_fts, 1, '', '', '…', 12) AS snippet
        FROM notes_fts
        JOIN notes ON notes.day = notes_fts.day
        WHERE notes_fts MATCH ? AND notes.day < ?
        ORDER BY notes.day DESC
        LIMIT ?
    """

    /**
     * The statements that lift a file from [from] to [VERSION], or null when
     * this build cannot read that version. Version 1 kept no index, so its rows
     * are already there to fill it from.
     */
    fun migration(from: Int): String? = when (from) {
        0 -> NOTES + INDEX
        1 -> INDEX + "INSERT INTO notes_fts (day, body) SELECT day, body FROM notes;"
        else -> null
    }

    /**
     * A search is words: every word must match, in any order, each as a prefix,
     * so "appl" finds "apple". Each word is quoted, so its characters are
     * literal and never FTS5 syntax; a word with no letter or number cannot
     * match a token and is dropped.
     */
    fun matchExpression(query: String): String =
        query.split(WHITESPACE)
            .filter { word -> word.any { it.isLetterOrDigit() } }
            .joinToString(" ") { word -> "\"" + word.replace("\"", "\"\"") + "\"*" }

    private val WHITESPACE = Regex("\\s+")
}
