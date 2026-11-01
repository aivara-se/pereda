package se.aivara.pereda.ui

import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import se.aivara.pereda.data.Note
import se.aivara.pereda.data.NoteLog

/**
 * The log and the day screen composed for real, on the JVM.
 *
 * There is no emulator in the build box, so Robolectric draws the screens and
 * the test reads the tree: today's placeholder, the older day, the bar's
 * disabled delete, and a day opening from a tap.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp-xhdpi")
class ScreensTest {
    @get:Rule
    val compose = createComposeRule()

    private val state = NoteLog.State(
        ready = true,
        today = "2026-11-01",
        anchor = "2026-11-01",
        entries = listOf(
            Note("2026-11-01", "", 0),
            Note("2026-10-31", "yesterday, in full", 1),
        ),
        more = false,
    )

    @Test
    fun `the log opens on today, with the placeholder and the older day`() {
        compose.setContent {
            PeredaTheme {
                LogScreen(
                    state = state,
                    listState = rememberLazyListState(),
                    onEdit = { _, _ -> },
                    onOpenDay = {},
                    onToday = {},
                    onSearch = {},
                    onDelete = {},
                    onLoadOlder = {},
                )
            }
        }

        compose.onNodeWithText("TODAY").assertIsDisplayed()
        compose.onNodeWithText("What happened?").assertIsDisplayed()
        compose.onNodeWithText("31 OCT 2026").assertIsDisplayed()
        compose.onNodeWithText("yesterday, in full").assertIsDisplayed()
        compose.onNodeWithContentDescription("Today").assertIsDisplayed()
        compose.onNodeWithContentDescription("Search").assertIsDisplayed()
    }

    @Test
    fun `delete is off while today is empty`() {
        compose.setContent {
            PeredaTheme {
                LogScreen(
                    state = state,
                    listState = rememberLazyListState(),
                    onEdit = { _, _ -> },
                    onOpenDay = {},
                    onToday = {},
                    onSearch = {},
                    onDelete = {},
                    onLoadOlder = {},
                )
            }
        }

        compose.onNodeWithContentDescription("Delete this note").assertIsNotEnabled()
    }

    @Test
    fun `delete is on once today has text`() {
        compose.setContent {
            PeredaTheme {
                LogScreen(
                    state = state.copy(entries = listOf(Note("2026-11-01", "written", 1))),
                    listState = rememberLazyListState(),
                    onEdit = { _, _ -> },
                    onOpenDay = {},
                    onToday = {},
                    onSearch = {},
                    onDelete = {},
                    onLoadOlder = {},
                )
            }
        }

        compose.onNodeWithContentDescription("Delete this note").assertIsEnabled()
    }

    @Test
    fun `a day screen shows its date, its text and its delete`() {
        compose.setContent {
            PeredaTheme {
                DayScreen(
                    state = state.copy(open = Note("2026-10-31", "yesterday, in full", 1)),
                    onEdit = { _, _ -> },
                    onBack = {},
                    onDelete = {},
                )
            }
        }

        compose.onNodeWithText("31 OCT 2026").assertIsDisplayed()
        compose.onNodeWithText("yesterday, in full").assertIsDisplayed()
        compose.onNodeWithContentDescription("Back").assertIsDisplayed()
        compose.onNodeWithContentDescription("Delete this note").assertIsDisplayed()
    }

    @Test
    fun `search shows its field, its cancel and an empty answer`() {
        compose.setContent {
            PeredaTheme {
                SearchScreen(
                    ui = se.aivara.pereda.PeredaViewModel.Ui(query = "appl", searched = true, results = emptyList()),
                    onQuery = {},
                    onCancel = {},
                    onOpenDay = {},
                )
            }
        }

        compose.onNodeWithText("No day matches those words.").assertIsDisplayed()
        compose.onNodeWithText("Cancel").assertIsDisplayed().performClick()
        compose.onAllNodesWithText("appl").assertCountEquals(1)
    }
}
