package se.aivara.pereda.data

import java.sql.Connection
import java.sql.DriverManager
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * The store's SQL, run against a real SQLite on the JVM.
 *
 * The app reaches this SQL through `androidx.sqlite`'s bundled driver, which is
 * SQLite 3 on every device; these tests are what says the schema, the triggers,
 * the migrations and FTS5 behave as the desktop's `store.js` does.
 */
class NotesSqlTest {
    private lateinit var db: Connection

    @Before
    fun open() {
        db = DriverManager.getConnection("jdbc:sqlite::memory:")
    }

    @After
    fun close() {
        db.close()
    }

    @Test
    fun `a new file gets the schema and the index at version two`() {
        migrate(0)

        assertEquals(2, query("PRAGMA user_version").first()[0].toInt())
        assertEquals(
            listOf("day", "body", "seq"),
            query("PRAGMA table_info(notes)").map { it[1] },
        )
        assertEquals(1, query("SELECT count(*) FROM sqlite_master WHERE name = 'notes_fts'").first()[0].toInt())
    }

    @Test
    fun `a version one file gains the index and its rows are backfilled`() {
        exec("CREATE TABLE notes (day TEXT PRIMARY KEY, body TEXT NOT NULL, seq INTEGER NOT NULL) WITHOUT ROWID")
        exec("INSERT INTO notes VALUES ('2026-10-31', 'apple pie', 1)")
        exec("PRAGMA user_version = 1")

        migrate(1)

        assertEquals(2, query("PRAGMA user_version").first()[0].toInt())
        assertEquals(listOf("2026-10-31"), search("appl", "2026-11-01"))
    }

    @Test
    fun `an unknown version has no migration`() {
        assertEquals(null, NotesSql.migration(3))
    }

    @Test
    fun `a page is days with a note, newest first, strictly before the bound`() {
        migrate(0)
        insert("2026-10-29", "three")
        insert("2026-10-30", "two")
        insert("2026-10-31", "one")
        insert("2026-11-01", "")

        assertEquals(
            listOf("2026-10-31", "2026-10-30", "2026-10-29"),
            page("2026-11-01", 10),
        )
        assertEquals(listOf("2026-10-30", "2026-10-29"), page("2026-10-31", 10))
        assertEquals(listOf("2026-10-31", "2026-10-30"), page("2026-11-01", 2))
    }

    @Test
    fun `a save with an older counter changes nothing`() {
        migrate(0)
        insert("2026-10-31", "newer", 5)

        exec(
            "INSERT INTO notes (day, body, seq) VALUES ('2026-10-31', 'older', 4) " +
                "ON CONFLICT(day) DO UPDATE SET body = excluded.body, seq = excluded.seq WHERE excluded.seq > notes.seq",
        )

        assertEquals(listOf("newer", "5"), query("SELECT body, seq FROM notes WHERE day = '2026-10-31'").first())
    }

    @Test
    fun `clearing a day keeps the tombstone and hides it from the page`() {
        migrate(0)
        insert("2026-10-31", "something", 1)
        exec("UPDATE notes SET body = '', seq = 2 WHERE day = '2026-10-31'")

        assertEquals(listOf("", "2"), query("SELECT body, seq FROM notes WHERE day = '2026-10-31'").first())
        assertEquals(emptyList<String>(), page("2026-11-01", 10))
        assertEquals(emptyList<String>(), search("some", "2026-11-01"))
    }

    @Test
    fun `search matches every word as a prefix, in any order`() {
        migrate(0)
        insert("2026-10-30", "an apple pie with cinnamon", 1)
        insert("2026-10-31", "pie of apples", 1)

        assertEquals(listOf("2026-10-31", "2026-10-30"), search("appl pi", "2026-11-01"))
        assertEquals(listOf("2026-10-31", "2026-10-30"), search("pi appl", "2026-11-01"))
        assertEquals(listOf("2026-10-30"), search("cinn", "2026-11-01"))
    }

    @Test
    fun `a search folds case but keeps the Swedish letters apart`() {
        migrate(0)
        insert("2026-10-30", "Ångström är öppen", 1)

        assertEquals(listOf("2026-10-30"), search("ångström", "2026-11-01"))
        assertEquals(listOf("2026-10-30"), search("ÅNGSTRÖM", "2026-11-01"))
        assertEquals(emptyList<String>(), search("angstrom", "2026-11-01"))
        assertEquals(emptyList<String>(), search("oppen", "2026-11-01"))
    }

    @Test
    fun `a search never returns the bound day and stops at fifty`() {
        migrate(0)
        for (day in 1..60) {
            val dayOfMonth = if (day <= 30) "2026-09-%02d".format(day) else "2026-10-%02d".format(day - 30)
            insert(dayOfMonth, "same word", 1)
        }
        insert("2026-11-01", "same word", 1)

        val hits = search("same", "2026-11-01")
        assertEquals(NotesSql.LIMIT, hits.size)
        assertTrue(hits.none { it == "2026-11-01" })
    }

    @Test
    fun `a word with no letter or number cannot match`() {
        assertEquals("", NotesSql.matchExpression("   ... ---  "))
        assertEquals("\"appl\"*", NotesSql.matchExpression("appl"))
        assertEquals("\"two\"* \"words\"*", NotesSql.matchExpression("two  words"))
        assertEquals("\"a\"\"b\"*", NotesSql.matchExpression("a\"b"))
    }

    private fun migrate(from: Int) {
        val migration = NotesSql.migration(from) ?: error("no migration from $from")
        for (statement in split(migration)) exec(statement)
        exec("PRAGMA user_version = ${NotesSql.VERSION}")
    }

    private fun insert(day: String, body: String, seq: Long = 1) {
        exec("INSERT INTO notes (day, body, seq) VALUES ('$day', '$body', $seq)")
    }

    private fun page(before: String, limit: Int): List<String> =
        query("SELECT day FROM notes WHERE body <> '' AND day < '$before' ORDER BY day DESC LIMIT $limit")
            .map { it[0] }

    @Suppress("SqlSourceToSinkFlow")
    private fun search(query: String, before: String): List<String> {
        val expression = NotesSql.matchExpression(query)
        if (expression.isEmpty()) return emptyList()
        val statement = db.prepareStatement(
            "SELECT notes.day FROM notes_fts JOIN notes ON notes.day = notes_fts.day " +
                "WHERE notes_fts MATCH ? AND notes.day < ? ORDER BY notes.day DESC LIMIT ?",
        )
        statement.use {
            it.setString(1, expression)
            it.setString(2, before)
            it.setInt(3, NotesSql.LIMIT)
            it.executeQuery().use { rows ->
                val days = mutableListOf<String>()
                while (rows.next()) days += rows.getString(1)
                return days
            }
        }
    }

    private fun exec(sql: String) {
        db.createStatement().use { it.execute(sql) }
    }

    private fun query(sql: String): List<List<String>> =
        db.createStatement().use { statement ->
            statement.executeQuery(sql).use { rows ->
                val columns = rows.metaData.columnCount
                val result = mutableListOf<List<String>>()
                while (rows.next()) {
                    result += (1..columns).map { rows.getString(it) ?: "" }
                }
                result
            }
        }

    /**
     * JDBC executes one statement at a time, and a trigger's body holds its own
     * semicolons; this keeps `CREATE TRIGGER ... BEGIN ... END` whole.
     */
    private fun split(sql: String): List<String> {
        val parts = sql.split(";").map { it.trim() }.filter { it.isNotEmpty() }
        val statements = mutableListOf<String>()
        var index = 0
        while (index < parts.size) {
            var statement = parts[index]
            if (statement.contains("CREATE TRIGGER", ignoreCase = true) && !statement.contains("END", ignoreCase = true)) {
                do {
                    index++
                    statement += ";\n" + parts[index]
                } while (index < parts.size - 1 && !parts[index].equals("END", ignoreCase = true))
            }
            statements += statement
            index++
        }
        return statements
    }
}
