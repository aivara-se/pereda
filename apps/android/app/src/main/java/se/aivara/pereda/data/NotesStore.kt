package se.aivara.pereda.data

import androidx.sqlite.SQLiteConnection
import androidx.sqlite.SQLiteDriver
import androidx.sqlite.driver.bundled.BundledSQLiteDriver
import androidx.sqlite.execSQL
import java.io.File

/**
 * The notes on the phone: one SQLite file, opened with the bundled driver.
 *
 * The platform's SQLite has no FTS5, so the app carries its own (`androidx.sqlite`
 * bundled). That also makes the file schema-for-schema the desktop's, which is
 * what lets a database move between them. Room is deliberately absent for the
 * same reason: no generated schema, no migration of its own, the desktop's SQL.
 */
class NotesStore private constructor(
    private val connection: SQLiteConnection,
    override val path: String,
) : Notes {

    override fun note(day: String): Note? =
        connection.prepare(NotesSql.READ).use { statement ->
            statement.bindText(1, day)
            if (!statement.step()) return null
            Note(day = day, body = statement.getText(0), seq = statement.getLong(1))
        }

    override fun save(day: String, body: String, seq: Long): SaveOutcome {
        // An impossible date is refused before the write, as the desktop refuses it.
        require(Day.isValid(day)) { "That is not a date." }
        connection.prepare(NotesSql.WRITE).use { statement ->
            statement.bindText(1, day)
            statement.bindText(2, body)
            statement.bindLong(3, seq)
            statement.step()
        }
        // The statement's own success says a row changed; only reading it back
        // says *this* body is the one stored, which is what tells a stale save
        // from an applied one.
        val row = note(day) ?: return SaveOutcome.Stale
        return if (row.seq == seq && row.body == body) SaveOutcome.Applied(row) else SaveOutcome.Stale
    }

    override fun page(before: String, limit: Int): List<Note> =
        connection.prepare(NotesSql.PAGE).use { statement ->
            statement.bindText(1, before)
            statement.bindLong(2, limit.toLong())
            buildList {
                while (statement.step()) {
                    add(Note(day = statement.getText(0), body = statement.getText(1), seq = statement.getLong(2)))
                }
            }
        }

    override fun search(query: String, before: String): List<SearchHit> {
        val expression = NotesSql.matchExpression(query)
        if (expression.isEmpty()) return emptyList()
        return connection.prepare(NotesSql.SEARCH).use { statement ->
            statement.bindText(1, expression)
            statement.bindText(2, before)
            statement.bindLong(3, NotesSql.LIMIT.toLong())
            buildList {
                while (statement.step()) {
                    add(SearchHit(day = statement.getText(0), snippet = statement.getText(1)))
                }
            }
        }
    }

    override fun close() {
        connection.close()
    }

    companion object {
        /** The file's name in the app's own database folder. */
        const val FILE = "pereda.db"

        /**
         * Open the database at [path], check it, and bring it to [NotesSql.VERSION].
         *
         * A file that is not a database, a failed integrity check and an unknown
         * version all throw [StoreUnavailable] naming the file; nothing is
         * deleted, recreated or repaired over the notes.
         */
        fun open(path: String, driver: SQLiteDriver = BundledSQLiteDriver()): NotesStore {
            File(path).parentFile?.mkdirs()
            val connection = try {
                driver.open(path)
            } catch (error: Exception) {
                throw StoreUnavailable("Pereda could not open its notes at $path: ${error.reason()}")
            }

            try {
                connection.execSQL("PRAGMA journal_mode = WAL")
                connection.execSQL("PRAGMA synchronous = FULL")
                val integrity = connection.integrityCheck()
                if (integrity != "ok") throw IllegalStateException("the integrity check says $integrity")
            } catch (error: Exception) {
                runCatching { connection.close() }
                throw StoreUnavailable("Pereda could not open its notes at $path: ${error.reason()}")
            }

            try {
                val version = connection.version()
                if (version != NotesSql.VERSION) {
                    val migration = NotesSql.migration(version)
                        ?: throw IllegalStateException(
                            "version $version, and this build reads version ${NotesSql.VERSION}",
                        )
                    connection.execSQL("BEGIN")
                    try {
                        connection.execSQL(migration)
                        connection.execSQL("PRAGMA user_version = ${NotesSql.VERSION}")
                        connection.execSQL("COMMIT")
                    } catch (error: Exception) {
                        runCatching { connection.execSQL("ROLLBACK") }
                        throw error
                    }
                }
            } catch (error: Exception) {
                runCatching { connection.close() }
                throw StoreUnavailable("Pereda could not open its notes at $path: ${error.reason()}")
            }

            return NotesStore(connection, path)
        }

        private fun SQLiteConnection.integrityCheck(): String =
            prepare("PRAGMA integrity_check").use { statement ->
                if (statement.step()) statement.getText(0) else "nothing"
            }

        private fun SQLiteConnection.version(): Int =
            prepare("PRAGMA user_version").use { statement ->
                if (statement.step()) statement.getInt(0) else 0
            }

        private fun Exception.reason(): String = message ?: this::class.simpleName ?: "it could not be read"
    }
}
