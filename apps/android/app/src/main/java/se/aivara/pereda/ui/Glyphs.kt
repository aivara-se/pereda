package se.aivara.pereda.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

/*
 * The bar's icons, drawn from the desktop's SVGs at the same 1.6 stroke on a
 * 24-unit grid. They are a Canvas rather than a dependency: four paths do not
 * earn an icon library.
 */

private const val GRID = 24f
private const val STROKE = 1.6f

@Composable
fun TodayGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier.size(19.dp)) {
        val s = size.minDimension / GRID
        drawCircle(color = tint, radius = 8f * s, style = Stroke(width = STROKE * s))
        drawCircle(color = tint, radius = 2.5f * s)
    }
}

@Composable
fun SearchGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier.size(19.dp)) {
        val s = size.minDimension / GRID
        drawCircle(
            color = tint,
            radius = 7f * s,
            center = Offset(11f * s, 11f * s),
            style = Stroke(width = STROKE * s, cap = StrokeCap.Round),
        )
        drawLine(
            color = tint,
            start = Offset(16f * s, 16f * s),
            end = Offset(20.5f * s, 20.5f * s),
            strokeWidth = STROKE * s,
            cap = StrokeCap.Round,
        )
    }
}

@Composable
fun TrashGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier.size(19.dp)) {
        val s = size.minDimension / GRID
        val path = Path().apply {
            moveTo(5f * s, 7f * s)
            lineTo(19f * s, 7f * s)
            moveTo(10f * s, 7f * s)
            lineTo(10f * s, 5f * s)
            lineTo(14f * s, 5f * s)
            lineTo(14f * s, 7f * s)
            moveTo(7f * s, 7f * s)
            lineTo(8f * s, 19f * s)
            lineTo(16f * s, 19f * s)
            lineTo(17f * s, 7f * s)
        }
        drawPath(
            path = path,
            color = tint,
            style = Stroke(width = STROKE * s, cap = StrokeCap.Round, join = StrokeJoin.Round),
        )
    }
}

@Composable
fun BackGlyph(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier.size(19.dp)) {
        val s = size.minDimension / GRID
        val path = Path().apply {
            moveTo(14.5f * s, 5f * s)
            lineTo(8f * s, 12f * s)
            lineTo(14.5f * s, 19f * s)
        }
        drawPath(
            path = path,
            color = tint,
            style = Stroke(width = STROKE * s, cap = StrokeCap.Round, join = StrokeJoin.Round),
        )
    }
}
