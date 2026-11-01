package se.aivara.pereda.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import se.aivara.pereda.R
import se.aivara.pereda.data.Day
import se.aivara.pereda.data.Note
import se.aivara.pereda.data.NoteLog

/**
 * The log: today's note at the top and writable, older days behind it and read
 * only. On a phone the log cannot edit and read at once, so a tap opens the day
 * on its own screen.
 */
@Composable
fun LogScreen(
    state: NoteLog.State,
    listState: LazyListState,
    onEdit: (String, String) -> Unit,
    onOpenDay: (String) -> Unit,
    onToday: () -> Unit,
    onSearch: () -> Unit,
    onDelete: (String) -> Unit,
    onLoadOlder: () -> Unit,
) {
    val today = state.entries.firstOrNull() ?: return
    var focused by remember { mutableStateOf(false) }
    var confirming by remember { mutableStateOf(false) }
    val focusRequester = remember { FocusRequester() }

    // The app opens on today with the caret in the note, and the window keeps
    // the keyboard down until the note is tapped.
    LaunchedEffect(state.anchor) { focusRequester.requestFocus() }

    LaunchedEffect(listState, state.more, state.entries.size) {
        snapshotFlow { listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: -1 }
            .collect { last ->
                if (state.more && last >= state.entries.size - 2) onLoadOlder()
            }
    }

    Column(Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BarButton(description = stringResource(R.string.today), onClick = onToday) { TodayGlyph(it) }
            Spacer(Modifier.weight(1f))
            BarButton(description = stringResource(R.string.search), onClick = onSearch) { SearchGlyph(it) }
            BarButton(
                description = stringResource(R.string.delete),
                onClick = { confirming = true },
                enabled = focused && today.body.isNotEmpty(),
            ) { TrashGlyph(it) }
        }

        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 22.dp, bottom = 96.dp),
        ) {
            item(key = "today") {
                Column(Modifier.fillMaxWidth().padding(bottom = 40.dp)) {
                    DateLabel(text = stringResource(R.string.today), emphasized = focused)
                    Spacer(Modifier.height(4.dp))
                    NoteField(
                        body = today.body,
                        onEdit = { onEdit(today.day, it) },
                        focusRequester = focusRequester,
                        onFocusChanged = { focused = it },
                    )
                }
            }

            items(state.entries.drop(1), key = { it.day }) { note ->
                PastEntry(note = note, onOpen = { onOpenDay(note.day) })
            }

            if (state.more) {
                item(key = "more") {
                    Text(
                        text = if (state.loading) stringResource(R.string.loading) else "",
                        style = labelStyle(),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                    )
                }
            }
        }
    }

    if (confirming) {
        ConfirmDelete(
            title = stringResource(R.string.delete_today_title),
            onConfirm = {
                confirming = false
                onDelete(today.day)
            },
            onDismiss = { confirming = false },
        )
    }
}

/** An older day in the log: its date and its text, read only, a tap opens it. */
@Composable
private fun PastEntry(note: Note, onOpen: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpen)
            .padding(bottom = 40.dp),
    ) {
        DateLabel(text = Day.short(note.day), emphasized = false)
        Spacer(Modifier.height(4.dp))
        Text(text = note.body, style = noteStyle())
    }
}
