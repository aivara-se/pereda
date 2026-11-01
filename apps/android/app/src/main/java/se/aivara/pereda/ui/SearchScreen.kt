package se.aivara.pereda.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import se.aivara.pereda.PeredaViewModel
import se.aivara.pereda.R
import se.aivara.pereda.data.Day

/**
 * The search: a mode over the log, never a second page of the log.
 *
 * It finds days before today by their words, each word a prefix, and a result
 * opens that day. Cancel, or back, returns to the log at today.
 */
@Composable
fun SearchScreen(
    ui: PeredaViewModel.Ui,
    onQuery: (String) -> Unit,
    onCancel: () -> Unit,
    onOpenDay: (String) -> Unit,
) {
    val palette = LocalPalette.current
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) { focusRequester.requestFocus() }

    Column(Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 6.dp)
                .height(44.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.accentSoft)
                    .padding(horizontal = 12.dp),
                contentAlignment = Alignment.CenterStart,
            ) {
                if (ui.query.isEmpty()) {
                    Text(
                        text = stringResource(R.string.search_hint),
                        style = TextStyle(fontFamily = InstrumentSans, fontSize = 14.sp, color = palette.muted),
                    )
                }
                BasicTextField(
                    value = ui.query,
                    onValueChange = onQuery,
                    singleLine = true,
                    textStyle = TextStyle(fontFamily = InstrumentSans, fontSize = 15.sp, color = palette.ink),
                    cursorBrush = SolidColor(palette.accent),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    modifier = Modifier.fillMaxWidth().focusRequester(focusRequester),
                )
            }
            Text(
                text = stringResource(R.string.cancel),
                style = TextStyle(fontFamily = InstrumentSans, fontSize = 14.sp, color = palette.muted),
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(onClick = onCancel)
                    .padding(horizontal = 12.dp, vertical = 10.dp),
            )
        }

        when {
            ui.searching -> Hint(stringResource(R.string.search_reading))
            ui.searched && ui.results.isEmpty() -> Hint(stringResource(R.string.search_empty))
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 14.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(28.dp),
            ) {
                items(ui.results, key = { it.day }) { hit ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onOpenDay(hit.day) },
                    ) {
                        DateLabel(text = Day.short(hit.day), emphasized = false)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = hit.snippet,
                            style = noteStyle().copy(fontSize = 17.sp, lineHeight = 27.sp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun Hint(text: String) {
    Text(
        text = text,
        style = TextStyle(fontFamily = InstrumentSans, fontSize = 14.sp, color = LocalPalette.current.muted),
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 32.dp),
    )
}
