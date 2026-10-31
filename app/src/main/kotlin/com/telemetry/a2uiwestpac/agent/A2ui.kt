package com.telemetry.a2uiwestpac.agent

import org.json.JSONArray
import org.json.JSONObject

/**
 * Tiny helpers for authoring basic-catalog components as plain maps, which
 * serialise to ordinary A2UI v0.9 JSON. They exist only to keep the scenarios
 * readable; the renderer validates the result.
 */
const val CATALOG_ID = "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json"

typealias Component = Map<String, Any?>

/** One A2UI envelope, kept as JSON text because that is the wire format. */
data class Envelope(val json: String) {
    val kind: String
        get() = KINDS.firstOrNull { json.contains("\"$it\"") } ?: "message"

    val surfaceId: String?
        get() = runCatching { JSONObject(json).getJSONObject(kind).optString("surfaceId", null) }.getOrNull()

    /** A short label for the stream inspector, e.g. `updateComponents ×9`. */
    val label: String
        get() = runCatching {
            val body = JSONObject(json).getJSONObject(kind)
            when (kind) {
                "updateComponents" -> "updateComponents ×${body.getJSONArray("components").length()}"
                "updateDataModel" -> if (body.has("path")) "updateDataModel ${body.getString("path")}" else "updateDataModel"
                else -> kind
            }
        }.getOrDefault(kind)

    val pretty: String get() = runCatching { JSONObject(json).toString(2) }.getOrDefault(json)

    companion object {
        private val KINDS = listOf("createSurface", "updateComponents", "updateDataModel", "deleteSurface")
    }
}

private fun envelope(key: String, body: Map<String, Any?>): Envelope =
    Envelope(JSONObject(mapOf("version" to "v0.9", key to body)).toString())

fun createSurface(surfaceId: String): Envelope =
    envelope("createSurface", mapOf("surfaceId" to surfaceId, "catalogId" to CATALOG_ID, "sendDataModel" to true))

fun update(surfaceId: String, components: List<Component>): Envelope =
    envelope("updateComponents", mapOf("surfaceId" to surfaceId, "components" to components))

fun data(surfaceId: String, value: Any?, path: String? = null): Envelope =
    envelope("updateDataModel", buildMap {
        put("surfaceId", surfaceId)
        if (path != null) put("path", path)
        put("value", value)
    })

fun deleteSurface(surfaceId: String): Envelope = envelope("deleteSurface", mapOf("surfaceId" to surfaceId))

// ---- components -------------------------------------------------------------

fun text(id: String, text: Any?, variant: String? = null): Component = buildMap {
    put("id", id); put("component", "Text"); put("text", text)
    if (variant != null) put("variant", variant)
}

fun caption(id: String, t: Any?): Component = text(id, t, "caption")

fun icon(id: String, name: String): Component = mapOf("id" to id, "component" to "Icon", "name" to name)

fun column(id: String, children: Any, vararg extra: Pair<String, Any?>): Component =
    mapOf("id" to id, "component" to "Column", "children" to children) + extra

fun row(id: String, children: Any, vararg extra: Pair<String, Any?>): Component =
    mapOf("id" to id, "component" to "Row", "children" to children) + extra

fun card(id: String, child: String): Component = mapOf("id" to id, "component" to "Card", "child" to child)

fun divider(id: String): Component = mapOf("id" to id, "component" to "Divider")

/** A labelled button is two components in A2UI: the label Text and the Button. */
fun button(
    id: String,
    label: String,
    variant: String,
    event: String,
    context: Map<String, Any?> = emptyMap(),
): List<Component> = listOf(
    text("${id}_label", label),
    mapOf(
        "id" to id,
        "component" to "Button",
        "child" to "${id}_label",
        "variant" to variant,
        "action" to mapOf("event" to mapOf("name" to event, "context" to context)),
    ),
)

/** `formatCurrency` is a catalog function, so the agent never formats money itself. */
fun aud(value: Any?): Map<String, Any?> =
    mapOf("call" to "formatCurrency", "args" to mapOf("value" to value, "currency" to "AUD"), "returnType" to "string")

/** `formatString` interpolates `${/data/path}` and `${fn(arg:value)}` on the client. */
fun fmt(value: String): Map<String, Any?> =
    mapOf("call" to "formatString", "args" to mapOf("value" to value), "returnType" to "string")

fun path(p: String): Map<String, Any?> = mapOf("path" to p)

/** A `checks` rule: a boolean function call plus the message shown when it fails. */
fun check(call: String, args: Map<String, Any?>, message: String): Map<String, Any?> =
    mapOf("condition" to mapOf("call" to call, "args" to args, "returnType" to "boolean"), "message" to message)

fun required(p: String, message: String) = check("required", mapOf("value" to path(p)), message)

/** Parses one line of JSONL into a map the stream inspector can show. */
fun prettyJson(json: String): String = runCatching {
    if (json.trimStart().startsWith("[")) JSONArray(json).toString(2) else JSONObject(json).toString(2)
}.getOrDefault(json)
