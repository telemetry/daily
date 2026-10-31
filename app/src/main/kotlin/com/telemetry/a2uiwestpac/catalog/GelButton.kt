package com.telemetry.a2uiwestpac.catalog

import androidx.a2ui.compose.runtime.A2uiComponentScope
import androidx.a2ui.compose.runtime.A2uiComponentState
import androidx.a2ui.compose.ui.A2uiComponent
import androidx.a2ui.compose.ui.catalog.A2uiBasicCatalogV1
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.telemetry.a2uiwestpac.theme.GelWbc
import com.telemetry.a2uiwestpac.theme.LocalSkin
import com.telemetry.a2uiwestpac.theme.Skin

/**
 * The basic catalog's Button, drawn to GEL's spec when the Westpac skin is on
 * and to stock Material when it is not. Implements the typed slot interface so
 * it can be dropped into [materialA2uiBasicCatalogV1] as `button =`.
 *
 * A2UI's three hints map onto Material's emphasis ladder:
 * primary → filled, secondary (the default) → outlined, borderless → text.
 */
object GelButton : A2uiBasicCatalogV1.Button {

    @Composable
    override fun A2uiComponentScope.TypedContent(
        childId: String,
        variant: A2uiBasicCatalogV1.Button.Variant,
        action: Map<String, Any?>,
        accessibility: A2uiBasicCatalogV1.AccessibilityAttributes?,
        checks: List<A2uiBasicCatalogV1.CheckRule>,
        modifier: Modifier,
    ) {
        val currentAction by rememberUpdatedState(action)
        val onClick: () -> Unit = remember { { dispatchAction(currentAction) } }
        val childState = observeA2uiComponentState(childId)
        val enabled = childState is A2uiComponentState.Success && checks.all { it.condition }
        val gel = LocalSkin.current == Skin.Westpac

        val shape = if (gel) RoundedCornerShape(GelWbc.radiusSm) else ButtonDefaults.shape
        val content: @Composable RowScope.() -> Unit = {
            when (val state = childState) {
                is A2uiComponentState.Success -> A2uiComponent(component = state.component)
                is A2uiComponentState.Loading -> CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                is A2uiComponentState.Error -> Text("Error")
            }
        }

        when (variant) {
            A2uiBasicCatalogV1.Button.Variant.Primary -> Button(
                onClick = onClick,
                modifier = modifier,
                enabled = enabled,
                shape = shape,
                content = content,
            )
            A2uiBasicCatalogV1.Button.Variant.Borderless -> TextButton(
                onClick = onClick,
                modifier = modifier,
                enabled = enabled,
                shape = shape,
                content = content,
            )
            A2uiBasicCatalogV1.Button.Variant.Secondary -> OutlinedButton(
                onClick = onClick,
                modifier = modifier,
                enabled = enabled,
                shape = shape,
                // GEL's secondary button is outlined in the primary colour.
                border = if (gel) BorderStroke(1.dp, MaterialTheme.colorScheme.primary) else ButtonDefaults.outlinedButtonBorder(enabled),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary),
                content = content,
            )
        }
    }
}
