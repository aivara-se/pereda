package se.aivara.pereda.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import se.aivara.pereda.R

/** A 44 dp target in the bar; disabled keeps its place and loses its ink. */
@Composable
fun BarButton(
    description: String,
    onClick: () -> Unit,
    enabled: Boolean = true,
    glyph: @Composable (Color) -> Unit,
) {
    val palette = LocalPalette.current
    Box(
        modifier = Modifier
            .size(44.dp)
            .clip(RoundedCornerShape(10.dp))
            .clickable(enabled = enabled, onClickLabel = description, onClick = onClick)
            .semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) {
        glyph(if (enabled) palette.icon else palette.icon.copy(alpha = 0.28f))
    }
}

/** The date beside a note: 11 pt sans, uppercase, tracked out. */
@Composable
fun DateLabel(text: String, emphasized: Boolean, modifier: Modifier = Modifier) {
    val palette = LocalPalette.current
    Text(
        text = text.uppercase(LocalConfiguration.current.locales[0]),
        style = labelStyle().copy(color = if (emphasized) palette.ink else palette.muted),
        modifier = modifier,
    )
}

/** The note itself: plain text, whole, with the caret in the accent. */
@Composable
fun NoteField(
    body: String,
    onEdit: (String) -> Unit,
    modifier: Modifier = Modifier,
    focusRequester: FocusRequester? = null,
    onFocusChanged: ((Boolean) -> Unit)? = null,
) {
    val palette = LocalPalette.current
    val style = noteStyle()
    BasicTextField(
        value = body,
        onValueChange = onEdit,
        textStyle = style,
        cursorBrush = SolidColor(palette.accent),
        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
        modifier = modifier
            .fillMaxWidth()
            .then(if (focusRequester != null) Modifier.focusRequester(focusRequester) else Modifier)
            .then(
                if (onFocusChanged != null) {
                    Modifier.onFocusChanged { onFocusChanged(it.isFocused) }
                } else {
                    Modifier
                },
            ),
        decorationBox = { field ->
            Box {
                if (body.isEmpty()) {
                    Text(
                        text = stringResource(R.string.note_hint),
                        style = style.copy(color = palette.muted.copy(alpha = 0.5f)),
                    )
                }
                field()
            }
        },
    )
}

/** The one status line: a failed save in red, a notice in muted ink, nothing when empty. */
@Composable
fun StatusLine(text: String?, error: Boolean, modifier: Modifier = Modifier) {
    if (text == null) return
    val palette = LocalPalette.current
    Text(
        text = text,
        style = TextStyle(fontSize = 12.sp, lineHeight = 18.sp, color = if (error) palette.error else palette.muted),
        modifier = modifier
            .background(palette.paper, RoundedCornerShape(7.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    )
}

/** Delete asks once, and says what cannot be undone. */
@Composable
fun ConfirmDelete(title: String, onConfirm: () -> Unit, onDismiss: () -> Unit) {
    val palette = LocalPalette.current
    Dialog(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .widthIn(max = 340.dp)
                .background(palette.paper, RoundedCornerShape(14.dp))
                .padding(start = 20.dp, end = 12.dp, top = 20.dp, bottom = 12.dp),
        ) {
            Text(
                text = title,
                style = TextStyle(
                    fontFamily = InstrumentSans,
                    fontSize = 17.sp,
                    lineHeight = 24.sp,
                    fontWeight = FontWeight.Medium,
                    color = palette.ink,
                ),
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.delete_detail),
                style = TextStyle(fontSize = 14.sp, lineHeight = 21.sp, color = palette.muted),
                modifier = Modifier.padding(end = 8.dp),
            )
            Spacer(Modifier.height(20.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
            ) {
                DialogAction(text = stringResource(R.string.keep), color = palette.muted, onClick = onDismiss)
                DialogAction(text = stringResource(R.string.delete_confirm), color = palette.error, onClick = onConfirm)
            }
        }
    }
}

/** The screen that stops the app: the file is named, not touched. */
@Composable
fun FatalScreen(message: String) {
    val palette = LocalPalette.current
    Box(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(modifier = Modifier.widthIn(max = 544.dp)) {
            Text(
                text = stringResource(R.string.fatal_title),
                style = TextStyle(fontSize = 20.sp, lineHeight = 28.sp, fontWeight = FontWeight.Medium, color = palette.ink),
            )
            Spacer(Modifier.height(14.dp))
            Text(
                text = message,
                style = TextStyle(fontSize = 14.sp, lineHeight = 21.sp, color = palette.ink),
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = stringResource(R.string.fatal_hint),
                style = TextStyle(fontSize = 14.sp, lineHeight = 21.sp, color = palette.muted),
            )
        }
    }
}

@Composable
private fun DialogAction(text: String, color: Color, onClick: () -> Unit) {
    Text(
        text = text,
        style = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Medium, color = color),
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 10.dp),
    )
}
