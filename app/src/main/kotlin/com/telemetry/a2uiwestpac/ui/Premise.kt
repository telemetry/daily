package com.telemetry.a2uiwestpac.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** The thinking experiment, in prose. Rendered in the inspector's first tab. */
@Composable
fun Premise(modifier: Modifier = Modifier) {
    val t = MaterialTheme.typography
    val muted = MaterialTheme.colorScheme.onSurfaceVariant
    Column(modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
        Text("A THINKING EXPERIMENT", style = t.labelSmall, color = muted)
        Spacer(Modifier.height(6.dp))
        Text("The agent writes the intent.\nThe bank writes the interface.", style = t.headlineSmall)
        Spacer(Modifier.height(16.dp))
        Text(
            "A2UI lets an agent describe a screen as a flat list of components with data bindings: no code, no pixels, " +
                "no colours. The client owns a catalog of what may be drawn, and the agent can only ask for things in it.",
            style = t.bodyMedium,
        )
        Spacer(Modifier.height(10.dp))
        Text(
            "So what happens when the catalog is a bank’s design system? Here Google’s Material 3 implementation of the " +
                "basic catalog runs inside a MaterialTheme whose colour roles, shapes and type are pointed at Westpac GEL " +
                "tokens. One slot, the button, is overridden to GEL’s 3dp corners. The agent has never heard of Westpac.",
            style = t.bodyMedium,
        )
        Section("Three propositions")
        Bullet("1.", "Brand lives in the renderer, not the prompt. Switch the skin above mid-conversation. The stream does not change by a byte.")
        Bullet("2.", "Constraint is the feature. Every screen the agent invents is already on-system, because it can only compose from parts that exist.")
        Bullet("3.", "The surface is a view; the logic stays home. Drag the term-deposit slider: nothing is recalculated until “Update estimate” sends the data model back.")
        Section("Things to try")
        Bullet("•", "Run “Move money”, then watch the earlier accounts surface update by data path, not by re-render.")
        Bullet("•", "Open the Stream tab and read the envelopes the agent sent and the actions that came back.")
        Bullet("•", "Paste your own JSONL in Send. If it validates against the catalog, it renders in GEL.")
        Section("Seams")
        Bullet("•", "GEL ships light mode only. The dark scheme here is derived from the same primitives, and is a proposal.")
        Bullet("•", "The Westpac typeface is licensed and not included; headings use the system face in GEL navy.")
        Bullet("•", "The androidx A2UI renderer is alpha. Expect API churn between releases.")
        Bullet("•", "Hierarchy is the agent’s call. Who reviews a headline no designer wrote?")
        Spacer(Modifier.height(16.dp))
        Text(
            "Everything shown is fictional. Product names are used to think with Westpac’s design language; balances, " +
                "people and references are invented.",
            style = t.bodySmall,
            color = muted,
        )
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun Section(title: String) {
    Spacer(Modifier.height(18.dp))
    Text(title.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(6.dp))
}

@Composable
private fun Bullet(marker: String, body: String) {
    androidx.compose.foundation.layout.Row(Modifier.padding(bottom = 8.dp)) {
        Text(marker, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(end = 8.dp))
        Text(body, style = MaterialTheme.typography.bodyMedium)
    }
}
