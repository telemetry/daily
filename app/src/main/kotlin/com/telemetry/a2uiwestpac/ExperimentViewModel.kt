package com.telemetry.a2uiwestpac

import android.app.Application
import androidx.a2ui.compose.runtime.A2uiMessageParser
import androidx.a2ui.model.processor.A2uiMessageProcessor
import androidx.a2ui.model.processor.A2uiSurfaceModel
import androidx.a2ui.model.protocol.A2uiClientErrorMessage
import androidx.a2ui.model.protocol.A2uiClientEventMessage
import androidx.a2ui.model.protocol.A2uiClientToServerMessage
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.telemetry.a2uiwestpac.agent.ActionLike
import com.telemetry.a2uiwestpac.agent.AgentReply
import com.telemetry.a2uiwestpac.agent.Envelope
import com.telemetry.a2uiwestpac.agent.MockAgent
import com.telemetry.a2uiwestpac.agent.SCENARIOS
import com.telemetry.a2uiwestpac.agent.prettyJson
import com.telemetry.a2uiwestpac.catalog.westpacCatalog
import com.telemetry.a2uiwestpac.theme.Skin
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.time.LocalTime
import java.time.format.DateTimeFormatter

data class Turn(
    val id: Int,
    val role: Role,
    val text: String? = null,
    val thinking: List<String> = emptyList(),
    val surfaceIds: List<String> = emptyList(),
) {
    enum class Role { User, Agent }
}

data class StreamEntry(
    val id: Int,
    val dir: Dir,
    val label: String,
    val surfaceId: String?,
    val body: String,
    val at: String,
) {
    /** → agent to renderer, ← renderer to agent, ↳ typed by you, ! error */
    enum class Dir { In, Out, You, Error }
}

/**
 * Hosts the A2UI message processor (as the androidx docs recommend) and the
 * scripted agent, and keeps the transcript and the raw stream for the
 * inspector. Nothing in here knows about Westpac; the theme does.
 */
class ExperimentViewModel(app: Application) : AndroidViewModel(app) {

    private val parser = A2uiMessageParser()
    // The factory in androidx.a2ui.compose.ui shares its name with the model interface, hence the qualified call.
    private val processor: A2uiMessageProcessor =
        androidx.a2ui.compose.ui.A2uiMessageProcessor(catalogs = listOf(westpacCatalog(app)))
    private var agent = MockAgent()
    private var seq = 0

    /** Live surfaces, owned by the processor. */
    val surfaces: StateFlow<List<A2uiSurfaceModel>> = processor.activeSurfaces

    private val _turns = MutableStateFlow<List<Turn>>(emptyList())
    val turns: StateFlow<List<Turn>> = _turns.asStateFlow()

    private val _stream = MutableStateFlow<List<StreamEntry>>(emptyList())
    val stream: StateFlow<List<StreamEntry>> = _stream.asStateFlow()

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    val skin = MutableStateFlow(Skin.Westpac)
    val dark = MutableStateFlow<Boolean?>(null) // null follows the system
    val speed = MutableStateFlow(1f)

    init {
        viewModelScope.launch(Dispatchers.Default) { processor.collectMessages() }
        viewModelScope.launch(start = CoroutineStart.UNDISPATCHED) { processor.outboundEvents.collect(::onOutbound) }
        send(SCENARIOS.first().prompt)
    }

    fun send(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty() || _busy.value) return
        _busy.value = true
        _turns.update { it + Turn(++seq, Turn.Role.User, text = trimmed) }
        viewModelScope.launch {
            try {
                delay(200)
                play(agent.respond(trimmed))
            } finally {
                _busy.value = false
            }
        }
    }

    /** One envelope per line, as typed in the inspector's Send tab. */
    fun sendRaw(jsonl: String): String? {
        val lines = jsonl.lines().map { it.trim() }.filter { it.isNotEmpty() }
        if (lines.isEmpty()) return "Nothing to send."
        for (line in lines) {
            val json = runCatching { JSONObject(line) }.getOrElse { return "Not JSON: ${it.message}" }
            if (!json.has("version")) json.put("version", "v0.9")
            val envelope = Envelope(json.toString())
            apply(envelope, StreamEntry.Dir.You)
            val created = envelope.takeIf { it.kind == "createSurface" }?.surfaceId
            if (created != null) {
                _turns.update { it + Turn(++seq, Turn.Role.Agent, text = "From the Send tab.", surfaceIds = listOf(created)) }
            }
        }
        return null
    }

    fun reset() {
        for (surface in surfaces.value) {
            apply(Envelope("""{"version":"v0.9","deleteSurface":{"surfaceId":"${surface.id}"}}"""), StreamEntry.Dir.You)
        }
        _turns.value = emptyList()
        _stream.value = emptyList()
        agent = MockAgent()
    }

    // -------------------------------------------------------------------------

    private suspend fun play(reply: AgentReply) {
        val turnId = ++seq
        _turns.update { it + Turn(turnId, Turn.Role.Agent, text = reply.say) }
        for (line in reply.thinking) {
            delay((360 / speed.value).toLong())
            patchTurn(turnId) { it.copy(thinking = it.thinking + line) }
        }
        for (envelope in reply.messages) {
            delay((320 / speed.value).toLong())
            apply(envelope, StreamEntry.Dir.In)
            if (envelope.kind == "createSurface") {
                envelope.surfaceId?.let { id -> patchTurn(turnId) { it.copy(surfaceIds = it.surfaceIds + id) } }
            }
        }
    }

    private fun patchTurn(id: Int, f: (Turn) -> Turn) {
        _turns.update { list -> list.map { if (it.id == id) f(it) else it } }
    }

    private fun apply(envelope: Envelope, dir: StreamEntry.Dir) {
        log(dir, envelope.label, envelope.surfaceId, envelope.pretty)
        try {
            processor.processMessage(parser.parse(envelope.json))
        } catch (e: Exception) {
            log(StreamEntry.Dir.Error, "error", envelope.surfaceId, e.message ?: e.toString())
        }
    }

    private fun onOutbound(message: A2uiClientToServerMessage) {
        when (message) {
            is A2uiClientEventMessage -> {
                val body = JSONObject(
                    mapOf(
                        "name" to message.type,
                        "surfaceId" to message.surfaceId,
                        "sourceComponentId" to message.componentId,
                        "context" to message.context,
                    ),
                ).toString(2)
                log(StreamEntry.Dir.Out, "action ${message.type}", message.surfaceId, body)
                val reply = agent.respondToAction(
                    ActionLike(message.type, message.surfaceId, message.componentId, message.context),
                ) ?: return
                viewModelScope.launch { play(reply) }
            }
            is A2uiClientErrorMessage -> {
                log(StreamEntry.Dir.Error, "error ${message.code}", message.surfaceId, prettyJson(message.message))
            }
        }
    }

    private fun log(dir: StreamEntry.Dir, label: String, surfaceId: String?, body: String) {
        val at = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))
        _stream.update { it + StreamEntry(++seq, dir, label, surfaceId, body, at) }
    }
}
