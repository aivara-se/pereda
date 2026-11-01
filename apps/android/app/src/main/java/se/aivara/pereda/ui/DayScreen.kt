package se.aivara.pereda.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import se.aivara.pereda.R
import se.aivara.pereda.data.Day
import se.aivara.pereda.data.NoteLog

/**
 * One day on its own screen: the one surface the desktop does not have.
 *
 * The bar carries back, the day and delete; the note fills the rest. The field
 * waits for a tap, because opening a day to read it should not raise the
 * keyboard over the text.
 */
@Composable
fun DayScreen(
    state: NoteLog.State,
    onEdit: (String, String) -> Unit,
    onBack: () -> Unit,
    onDelete: (String) -> Unit,
) {
    val note = state.open ?: return
    var confirming by remember(note.day) { mutableStateOf(false) }

    Column(Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BarButton(description = stringResource(R.string.back), onClick = onBack) { BackGlyph(it) }
            Spacer(Modifier.weight(1f))
            DateLabel(text = Day.short(note.day), emphasized = true)
            Spacer(Modifier.weight(1f))
            BarButton(
                description = stringResource(R.string.delete),
                onClick = { confirming = true },
                enabled = note.body.isNotEmpty(),
            ) { TrashGlyph(it) }
        }

        NoteField(
            body = note.body,
            onEdit = { onEdit(note.day, it) },
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .padding(top = 14.dp, bottom = 24.dp),
        )
    }

    if (confirming) {
        ConfirmDelete(
            title = stringResource(R.string.delete_day_title, Day.short(note.day)),
            onConfirm = {
                confirming = false
                onDelete(note.day)
            },
            onDismiss = { confirming = false },
        )
    }
}
