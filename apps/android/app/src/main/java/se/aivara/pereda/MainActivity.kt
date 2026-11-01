package se.aivara.pereda

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import se.aivara.pereda.ui.PeredaApp
import se.aivara.pereda.ui.PeredaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PeredaTheme {
                PeredaApp()
            }
        }
    }
}
