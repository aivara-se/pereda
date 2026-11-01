package se.aivara.pereda.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DayTest {
    @Test
    fun `a day is a real date in a fixed-width format`() {
        assertTrue(Day.isValid("2026-11-01"))
        assertTrue(Day.isValid("2024-02-29"))
        assertFalse(Day.isValid("2026-02-29"))
        assertFalse(Day.isValid("2026-13-01"))
        assertFalse(Day.isValid("2026-04-31"))
        assertFalse(Day.isValid("2026-1-01"))
        assertFalse(Day.isValid("2026-11-01T10:00"))
        assertFalse(Day.isValid(""))
    }

    @Test
    fun `the day after the last of december is a new year`() {
        assertEquals("2027-01-01", Day.plusDays("2026-12-31", 1))
        assertEquals("2027-01-01", Day.plusDays("2026-11-01", 61))
        assertEquals("2026-10-31", Day.plusDays("2026-11-01", -1))
    }
}
