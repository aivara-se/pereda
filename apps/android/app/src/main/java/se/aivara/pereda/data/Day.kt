package se.aivara.pereda.data

import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * The calendar, shared by the store and the screens.
 *
 * A day is the phone's local calendar day written `YYYY-MM-DD`. The format is
 * fixed width on purpose: every day comparison in the app and in SQL is a
 * string comparison, so nothing has to parse a date to order two of them.
 */
object Day {
    private val ISO: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    /** Today on the phone's clock, as the store keys it. */
    fun today(): String = LocalDate.now().toString()

    /** True when [day] is a real date written `YYYY-MM-DD`; a leap day counts only in a leap year. */
    fun isValid(day: String): Boolean {
        if (day.length != 10) return false
        return try {
            LocalDate.parse(day, ISO).toString() == day
        } catch (_: Exception) {
            false
        }
    }

    /** The day [count] days after [day], for the exclusive upper bound of a page. */
    fun plusDays(day: String, count: Long): String = LocalDate.parse(day, ISO).plusDays(count).toString()

    /** The day in the log's short form: `3 Nov 2026`. */
    fun short(day: String): String = format(day, "d MMM yyyy")

    /**
     * A day and a month for the midnight line: `31 October`, with the year only
     * when [today] is in another one.
     */
    fun notice(day: String, today: String): String {
        val pattern = if (day.take(4) == today.take(4)) "d MMMM" else "d MMMM yyyy"
        return format(day, pattern)
    }

    private fun format(day: String, pattern: String): String =
        try {
            LocalDate.parse(day, ISO).format(DateTimeFormatter.ofPattern(pattern, Locale.getDefault()))
        } catch (_: Exception) {
            day
        }
}
