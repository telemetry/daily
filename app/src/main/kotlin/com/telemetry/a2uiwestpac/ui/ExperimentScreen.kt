package com.telemetry.a2uiwestpac.ui

import androidx.a2ui.model.processor.A2uiSurfaceModel
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.a2ui.A2uiSurface
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.telemetry.a2uiwestpac.ExperimentViewModel
import com.telemetry.a2uiwestpac.StreamEntry
import com.telemetry.a2uiwestpac.Turn
import com.telemetry.a2uiwestpac.agent.SCENARIOS
import com.telemetry.a2uiwestpac.theme.Skin

/**
 * The page: a transcript where A2UI surfaces render inline inside agent turns,
 * a composer with the four scenario prompts, and an inspector sheet with the
 * premise, the raw stream and a box to send your own envelopes.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExperimentScreen(vm: ExperimentViewModel) {
    val turns by vm.turns.collectAsStateWithLifecycle()
    val surfaces by vm.surfaces.collectAsStateWithLifecycle()
    val stream by vm.stream.collectAsStateWithLifecycle()
    val busy by vm.busy.collectAsStateWithLifecycle()
    val skin by vm.skin.collectAsStateWithLifecycle()
    val dark by vm.dark.collectAsStateWithLifecycle()
    var inspectorOpen by rememberSaveable { mutableStateOf(false) }
    val surfacesById = remember(surfaces) { surfaces.associateBy { it.id } }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Agent → Interface", style = MaterialTheme.typography.titleMedium)
                        Text("A2UI · Material 3 · Westpac GEL", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                actions = {
                    TextButton(onClick = { vm.dark.value = !(dark ?: false) }) { Text(if (dark == true) "Light" else "Dark") }
                    TextButton(onClick = { inspectorOpen = true }) { Text("Inspect") }
                },
            )
        },
        bottomBar = {
            Composer(
                busy = busy,
                onSend = vm::send,
                modifier = Modifier.navigationBarsPadding().imePadding(),
            )
        },
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            SkinSwitch(skin = skin, onChange = { vm.skin.value = it }, onReset = vm::reset)
            HorizontalDivider()
            Transcript(turns = turns, surfacesById = surfacesById, modifier = Modifier.weight(1f))
        }
    }

    if (inspectorOpen) {
        ModalBottomSheet(onDismissRequest = { inspectorOpen = false }, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
            Inspector(stream = stream, onSendRaw = vm::sendRaw)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SkinSwitch(skin: Skin, onChange: (Skin) -> Unit, onReset: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        SingleChoiceSegmentedButtonRow {
            Skin.entries.forEachIndexed { i, s ->
                SegmentedButton(
                    selected = skin == s,
                    onClick = { onChange(s) },
                    shape = SegmentedButtonDefaults.itemShape(index = i, count = Skin.entries.size),
                ) {
                    Text(if (s == Skin.Westpac) "Westpac GEL" else "Material baseline", style = MaterialTheme.typography.labelMedium)
                }
            }
        }
        TextButton(onClick = onReset) { Text("Start over") }
    }
}

@Composable
private fun Transcript(turns: List<Turn>, surfacesById: Map<String, A2uiSurfaceModel>, modifier: Modifier) {
    val listState = rememberLazyListState()
    LaunchedEffect(turns.size, turns.lastOrNull()?.surfaceIds?.size) {
        if (turns.isNotEmpty()) listState.animateScrollToItem(turns.lastIndex)
    }
    LazyColumn(
        state = listState,
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        items(turns, key = { it.id }) { turn ->
            when (turn.role) {
                Turn.Role.User -> UserBubble(turn.text.orEmpty())
                Turn.Role.Agent -> AgentTurn(turn, surfacesById)
            }
        }
    }
}

@Composable
private fun UserBubble(text: String) {
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
        Surface(
            color = MaterialTheme.colorScheme.secondaryContainer,
            contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
            shape = MaterialTheme.shapes.large,
        ) {
            Text(text, Modifier.padding(horizontal = 14.dp, vertical = 10.dp).widthIn(max = 280.dp), style = MaterialTheme.typography.bodyLarge)
        }
    }
}

@Composable
private fun AgentTurn(turn: Turn, surfacesById: Map<String, A2uiSurfaceModel>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        AnimatedVisibility(visible = turn.thinking.isNotEmpty()) {
            Row(Modifier.height(IntrinsicSize.Min)) {
                Box(Modifier.width(2.dp).fillMaxHeight().background(MaterialTheme.colorScheme.outlineVariant))
                Column(Modifier.padding(start = 12.dp)) {
                    turn.thinking.forEach {
                        Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        turn.text?.let { Text(it, style = MaterialTheme.typography.bodyLarge) }
        turn.surfaceIds.forEach { id ->
            val surface = surfacesById[id]
            if (surface != null) {
                key(id) { A2uiSurface(surfaceModel = surface, modifier = Modifier.fillMaxWidth()) }
            } else {
                Text("surface $id was deleted", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun Composer(busy: Boolean, onSend: (String) -> Unit, modifier: Modifier = Modifier) {
    var draft by rememberSaveable { mutableStateOf("") }
    Surface(modifier = modifier, tonalElevation = 2.dp) {
        Column(Modifier.padding(horizontal = 16.dp, vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SCENARIOS.forEach { s ->
                    AssistChip(onClick = { onSend(s.prompt) }, enabled = !busy, label = { Text(s.prompt) })
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = draft,
                    onValueChange = { draft = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Ask the agent…") },
                    singleLine = true,
                    enabled = !busy,
                )
                Button(onClick = { onSend(draft); draft = "" }, enabled = !busy && draft.isNotBlank()) { Text("Send") }
            }
        }
    }
}

@Composable
private fun Inspector(stream: List<StreamEntry>, onSendRaw: (String) -> String?) {
    var tab by rememberSaveable { mutableStateOf(0) }
    val tabs = listOf("Premise", "Stream · ${stream.size}", "Send")
    Column(Modifier.fillMaxWidth().fillMaxHeight(0.92f)) {
        TabRow(selectedTabIndex = tab) {
            tabs.forEachIndexed { i, title -> Tab(selected = tab == i, onClick = { tab = i }, text = { Text(title) }) }
        }
        when (tab) {
            0 -> Premise(Modifier.verticalScroll(rememberScrollState()))
            1 -> StreamList(stream)
            else -> SendRaw(onSendRaw)
        }
    }
}

@Composable
private fun StreamList(stream: List<StreamEntry>) {
    Column {
        Text(
            "Agent → renderer envelopes, and the actions the surfaces send back. Identical whichever skin is on.",
            Modifier.padding(16.dp, 12.dp),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        LazyColumn(contentPadding = PaddingValues(bottom = 24.dp)) {
            items(stream, key = { it.id }) { entry ->
                var open by rememberSaveable(entry.id) { mutableStateOf(false) }
                val mark = when (entry.dir) {
                    StreamEntry.Dir.In -> "→"
                    StreamEntry.Dir.Out -> "←"
                    StreamEntry.Dir.You -> "↳"
                    StreamEntry.Dir.Error -> "!"
                }
                val markColor = when (entry.dir) {
                    StreamEntry.Dir.Out -> MaterialTheme.colorScheme.tertiary
                    StreamEntry.Dir.Error -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                }
                Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(mark, color = markColor, fontFamily = FontFamily.Monospace)
                        TextButton(onClick = { open = !open }, contentPadding = PaddingValues(0.dp)) {
                            Text(entry.label, fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.bodySmall)
                        }
                        Spacer(Modifier.weight(1f))
                        Text(entry.surfaceId ?: "", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(entry.at, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    AnimatedVisibility(visible = open) {
                        SelectionContainer {
                            Text(
                                entry.body,
                                Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceContainer, MaterialTheme.shapes.small).padding(10.dp),
                                fontFamily = FontFamily.Monospace,
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SendRaw(onSendRaw: (String) -> String?) {
    var draft by rememberSaveable { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    val example = """{"version":"v0.9","createSurface":{"surfaceId":"mine","catalogId":"https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json"}}
{"version":"v0.9","updateComponents":{"surfaceId":"mine","components":[{"id":"root","component":"Card","child":"col"},{"id":"col","component":"Column","children":["h","b"]},{"id":"h","component":"Text","text":"Hello from you","variant":"h3"},{"id":"b","component":"Text","text":"Any *basic catalog* JSON renders here."}]}}"""
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("One A2UI envelope per line (JSONL). Your messages are logged as ↳ in the stream.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedTextField(
            value = draft,
            onValueChange = { draft = it },
            modifier = Modifier.fillMaxWidth().height(220.dp),
            placeholder = { Text(example, fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.bodySmall) },
            isError = error != null,
            supportingText = error?.let { { Text(it) } },
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TextButton(onClick = { draft = example }) { Text("Use example") }
            Button(onClick = { error = onSendRaw(draft); if (error == null) draft = "" }, enabled = draft.isNotBlank()) { Text("Send to renderer") }
        }
    }
}
