package se.aivara.pereda.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import se.aivara.pereda.R

/**
 * The desktop's paper, ink and accent, as Compose colours.
 *
 * The values are the CSS custom properties of `apps/desktop/src/frontend/style.css`;
 * keeping them here is what makes the two apps look like one product.
 */
@Immutable
data class Palette(
    val paper: Color,
    val ink: Color,
    val muted: Color,
    val icon: Color,
    val accent: Color,
    val accentSoft: Color,
    val error: Color,
)

val LightPalette = Palette(
    paper = Color(0xFFFAF9F6),
    ink = Color(0xFF26231F),
    muted = Color(0xFF7D756A),
    icon = Color(0xFF6A6155),
    accent = Color(0xFFA9541C),
    accentSoft = Color(0xFFF0E0CF),
    error = Color(0xFFA5342C),
)

val DarkPalette = Palette(
    paper = Color(0xFF121110),
    ink = Color(0xFFECE7DD),
    muted = Color(0xFF958D80),
    icon = Color(0xFFA79E90),
    accent = Color(0xFFDDA36C),
    accentSoft = Color(0xFF2A231B),
    error = Color(0xFFE59A92),
)

val LocalPalette = staticCompositionLocalOf { LightPalette }

/** Newsreader at the desktop's optical size and weight, for the note itself. */
val Newsreader = FontFamily(Font(R.font.newsreader, weight = FontWeight.Normal))

/** Instrument Sans at 500, for dates, labels and the chrome. */
val InstrumentSans = FontFamily(Font(R.font.instrument_sans, weight = FontWeight.Medium))

/** The note's type: 19 pt over 1.65, now 19 sp over 31.35 sp. */
@Composable
fun noteStyle(): TextStyle = TextStyle(
    fontFamily = Newsreader,
    fontSize = 19.sp,
    lineHeight = 31.35.sp,
    color = LocalPalette.current.ink,
)

/** A date or a label: 11 pt, uppercase by the caller, 0.1 em of tracking. */
@Composable
fun labelStyle(): TextStyle = TextStyle(
    fontFamily = InstrumentSans,
    fontSize = 11.sp,
    lineHeight = 16.5.sp,
    letterSpacing = 1.1.sp,
    fontWeight = FontWeight.Medium,
    color = LocalPalette.current.muted,
)

@Composable
fun PeredaTheme(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalPalette provides if (isSystemInDarkTheme()) DarkPalette else LightPalette) {
        content()
    }
}
