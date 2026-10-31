package com.telemetry.a2uiwestpac

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.telemetry.a2uiwestpac.theme.WestpacTheme
import com.telemetry.a2uiwestpac.ui.ExperimentScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val vm: ExperimentViewModel = viewModel()
            val skin by vm.skin.collectAsStateWithLifecycle()
            val darkPref by vm.dark.collectAsStateWithLifecycle()
            val dark = darkPref ?: isSystemInDarkTheme()
            WestpacTheme(skin = skin, dark = dark) {
                ExperimentScreen(vm)
            }
        }
    }
}
