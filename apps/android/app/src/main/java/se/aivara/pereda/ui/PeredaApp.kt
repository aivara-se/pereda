package se.aivara.pereda.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import se.aivara.pereda.PeredaViewModel
import se.aivara.pereda.Screen

/**
 * The app: one screen at a time on one sheet of paper, and one status line at
 * the bottom. A failed save outranks the midnight notice, as on the desktop.
 */
@Composable
fun PeredaApp(viewModel: PeredaViewModel = viewModel()) {
    val state by viewModel.log.state.collectAsStateWithLifecycle()
    val ui by viewModel.ui.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()
    val palette = LocalPalette.current

    LifecycleEventEffect(Lifecycle.Event.ON_START) { viewModel.onResume() }
    LifecycleEventEffect(Lifecycle.Event.ON_STOP) { viewModel.onStop() }

    BackHandler(enabled = ui.screen !is Screen.Log) { viewModel.back() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(palette.paper)
            .safeDrawingPadding(),
    ) {
        when {
            state.fatal != null -> FatalScreen(message = state.fatal!!)
            !state.ready -> Unit
            ui.screen is Screen.Search -> SearchScreen(
                ui = ui,
                onQuery = viewModel::setQuery,
                onCancel = viewModel::cancelSearch,
                onOpenDay = viewModel::openDay,
            )

            ui.screen is Screen.Day -> DayScreen(
                state = state,
                onEdit = viewModel::edit,
                onBack = viewModel::back,
                onDelete = viewModel::delete,
            )

            else -> LogScreen(
                state = state,
                listState = listState,
                onEdit = viewModel::edit,
                onOpenDay = viewModel::openDay,
                onToday = viewModel::goToday,
                onSearch = viewModel::openSearch,
                onDelete = viewModel::delete,
                onLoadOlder = viewModel::loadOlder,
            )
        }

        StatusLine(
            text = state.failure?.let { "Not saved — ${it.message}" } ?: state.logError ?: state.notice,
            error = state.failure != null || state.logError != null,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 16.dp, vertical = 16.dp),
        )
    }
}
