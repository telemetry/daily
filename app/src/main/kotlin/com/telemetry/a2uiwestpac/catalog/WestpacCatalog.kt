package com.telemetry.a2uiwestpac.catalog

import android.content.Context
import androidx.a2ui.compose.ui.A2uiCatalog
import androidx.a2ui.compose.ui.catalog.A2uiBasicCatalogV1
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.a2ui.catalog.MaterialA2uiBasicCatalogV1Defaults
import androidx.compose.material3.a2ui.catalog.materialA2uiBasicCatalogV1
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * The catalog the agent targets: Google's Material 3 implementation of the
 * A2UI basic catalog, with one slot swapped. Everything else is themed through
 * MaterialTheme (see WestpacTheme.kt), which is the point of the experiment:
 * the stream never changes, the design system does.
 *
 * Media components get placeholder renderers because no image or video
 * library is bundled; plug Coil or Media3 in here when you need them.
 */
fun westpacCatalog(context: Context): A2uiCatalog = materialA2uiBasicCatalogV1(
    image = MaterialA2uiBasicCatalogV1Defaults.image { _, description, _, modifier, _ ->
        MediaPlaceholder(label = description ?: "Image", modifier = modifier)
    },
    video = MaterialA2uiBasicCatalogV1Defaults.video { _, modifier, _ ->
        MediaPlaceholder(label = "Video", modifier = modifier)
    },
    audioPlayer = MaterialA2uiBasicCatalogV1Defaults.audioPlayer { _, description, modifier, _ ->
        MediaPlaceholder(label = description ?: "Audio", modifier = modifier)
    },
    // Default functions: formatCurrency, formatDate and friends use the
    // device locale, so an Australian phone prints "$", not "A$".
    functions = A2uiBasicCatalogV1.Functions(context),
    // GEL buttons are 3dp-radius rectangles, which Material's pill shape
    // cannot express through the theme alone. One overridden slot does it.
    button = GelButton,
)

@Composable
private fun MediaPlaceholder(label: String, modifier: Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(120.dp)
            .background(MaterialTheme.colorScheme.surfaceContainer, MaterialTheme.shapes.medium),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
