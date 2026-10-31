package com.telemetry.a2uiwestpac.agent

import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToLong
import kotlin.random.Random

/** What the mock agent hands back for a user turn or an action. */
data class AgentReply(
    /** Plain-language line shown in the transcript before the surface. */
    val say: String? = null,
    /** "Reasoning" lines, revealed one by one. Theatre, but honest theatre. */
    val thinking: List<String> = emptyList(),
    val messages: List<Envelope>,
)

data class ActionLike(
    val name: String,
    val surfaceId: String,
    val componentId: String,
    val context: Map<String, Any?>,
)

data class Scenario(val id: String, val title: String, val prompt: String, val match: Regex)

val SCENARIOS = listOf(
    Scenario("accounts", "Accounts", "What’s in my accounts?", Regex("account|balance|money|how much", RegexOption.IGNORE_CASE)),
    Scenario("transfer", "Move money", "Move $500 from Choice to eSaver", Regex("move|transfer|send|\\$\\d", RegexOption.IGNORE_CASE)),
    Scenario("dispute", "Dispute", "I don’t recognise a transaction", Regex("recogni[sz]e|dispute|fraud|charge|transaction", RegexOption.IGNORE_CASE)),
    Scenario("deposit", "Term deposit", "Set up a term deposit", Regex("deposit|save|interest|rate", RegexOption.IGNORE_CASE)),
)

/**
 * A scripted stand-in for an agent. It never writes UI code: it replies with
 * A2UI envelopes, and it reacts to the actions the surfaces send back.
 *
 * Everything here is fictional. Account names borrow Westpac product names
 * because the experiment is about Westpac's design language; the numbers,
 * references and people are invented.
 */
class MockAgent {
    private data class Account(val key: String, val name: String, val number: String, var balance: Double)

    private var seq = 0
    private var accountsSurface: String? = null
    private val accounts = listOf(
        Account("choice", "Westpac Choice", "032-000 12 3456", 2419.55),
        Account("esaver", "Westpac eSaver", "032-000 98 7654", 18250.00),
        Account("altitude", "Altitude Black", "•••• •••• •••• 4431", -812.40),
    )

    private fun sid(prefix: String): String = "$prefix-${++seq}"

    /** Reply to a typed message. Unknown requests get a menu, not a guess. */
    fun respond(input: String): AgentReply {
        val amount = Regex("\\$\\s?(\\d[\\d,]*(?:\\.\\d+)?)").find(input)?.groupValues?.get(1)?.replace(",", "")?.toDoubleOrNull()
        return when (SCENARIOS.firstOrNull { it.match.containsMatchIn(input) }?.id) {
            "accounts" -> accountsReply()
            "transfer" -> transferReply(amount ?: 500.0)
            "dispute" -> disputeReply()
            "deposit" -> depositReply()
            else -> menuReply()
        }
    }

    /** Reply to an action a surface dispatched. */
    fun respondToAction(action: ActionLike): AgentReply? {
        val ctx = action.context
        return when (action.name) {
            "choose" -> respond(ctx["prompt"]?.toString().orEmpty())
            "transfer_start" -> transferReply(500.0)
            "pay_start" -> payReply()
            "confirm_transfer" -> transferDone(action.surfaceId, ctx)
            "cancel" -> AgentReply(say = "No worries, nothing moved.", messages = listOf(deleteSurface(action.surfaceId)))
            "dispute_start" -> disputeForm(action.surfaceId, ctx)
            "dispute_submit" -> disputeDone(action.surfaceId, ctx)
            "td_estimate" -> depositEstimate(action.surfaceId, ctx)
            "td_open" -> depositDone(action.surfaceId, ctx)
            "pay_confirm" -> payDone(action.surfaceId, ctx)
            else -> null
        }
    }

    // -------------------------------------------------------------------------

    private fun accountRows() = accounts.map { mapOf("name" to it.name, "number" to it.number, "balance" to it.balance) }
    private fun total() = accounts.sumOf { it.balance }

    private fun menuReply(): AgentReply {
        val s = sid("menu")
        return AgentReply(
            say = "I can show you a few things. Pick one and I’ll build it.",
            thinking = listOf("No intent matched", "Offering the catalog of things I can do"),
            messages = listOf(
                createSurface(s),
                update(s, listOf(
                    column("root", listOf("title", "options")),
                    text("title", "Here’s what I can do", "h4"),
                    column("options", SCENARIOS.map { "opt_${it.id}" }, "align" to "start"),
                ) + SCENARIOS.flatMap { button("opt_${it.id}", it.prompt, "borderless", "choose", mapOf("prompt" to it.prompt)) }),
            ),
        )
    }

    private fun accountsReply(): AgentReply {
        val s = sid("accounts")
        accountsSurface = s
        return AgentReply(
            say = "Here’s where everything sits right now.",
            thinking = listOf("Fetching three accounts", "A list template keeps the component count flat", "Money is formatted by the client, not by me"),
            messages = listOf(
                createSurface(s),
                update(s, listOf(
                    column("root", listOf("heading", "list")),
                    text("heading", "Your accounts", "h3"),
                    mapOf("id" to "list", "component" to "List", "children" to mapOf("componentId" to "acct", "path" to "/accounts")),
                )),
                update(s, listOf(
                    card("acct", "acct_row"),
                    row("acct_row", listOf("acct_meta", "acct_balance"), "justify" to "spaceBetween", "align" to "center"),
                    column("acct_meta", listOf("acct_name", "acct_number")),
                    text("acct_name", path("name"), "h5"),
                    caption("acct_number", path("number")),
                    text("acct_balance", aud(path("balance")), "h4"),
                )),
                data(s, mapOf("accounts" to accountRows(), "total" to total())),
                update(s, listOf(
                    column("root", listOf("heading", "list", "total", "actions")),
                    row("total", listOf("total_label", "total_value"), "justify" to "spaceBetween", "align" to "center"),
                    caption("total_label", "Net position"),
                    text("total_value", aud(path("/total")), "h4"),
                    row("actions", listOf("btn_transfer", "btn_pay"), "justify" to "start"),
                ) + button("btn_transfer", "Move money", "primary", "transfer_start")
                  + button("btn_pay", "Pay someone", "default", "pay_start")),
            ),
        )
    }

    private fun accountChips() = accounts.map { mapOf("label" to it.name, "value" to it.key) }

    private fun transferReply(amount: Double): AgentReply {
        val s = sid("transfer")
        val today = LocalDate.now().toString()
        return AgentReply(
            say = "Check the details and confirm.",
            thinking = listOf("Two accounts, an amount, a date", "Validation runs on the client via catalog functions", "I only hear back when Confirm is pressed"),
            messages = listOf(
                createSurface(s),
                // Data first: the checks bind to paths, and the spec allows any order.
                data(s, mapOf("from" to listOf("choice"), "to" to listOf("esaver"), "amount" to amount, "date" to today, "repeat" to false)),
                update(s, listOf(
                    card("root", "form"),
                    column("form", listOf("title", "from", "to", "amount", "when", "repeat", "rule", "actions")),
                    text("title", "Move money", "h3"),
                    mapOf("id" to "from", "component" to "ChoicePicker", "label" to "From", "displayStyle" to "chips", "variant" to "mutuallyExclusive", "options" to accountChips(), "value" to path("/from")),
                    mapOf("id" to "to", "component" to "ChoicePicker", "label" to "To", "displayStyle" to "chips", "variant" to "mutuallyExclusive", "options" to accountChips(), "value" to path("/to")),
                    mapOf(
                        "id" to "amount", "component" to "TextField", "label" to "Amount (AUD)", "variant" to "number", "value" to path("/amount"),
                        "checks" to listOf(required("/amount", "Enter an amount."), check("numeric", mapOf("value" to path("/amount"), "min" to 0.01), "Amount must be positive.")),
                    ),
                    mapOf("id" to "when", "component" to "DateTimeInput", "label" to "When", "enableDate" to true, "value" to path("/date")),
                    mapOf("id" to "repeat", "component" to "CheckBox", "label" to "Repeat monthly", "value" to path("/repeat")),
                    divider("rule"),
                    row("actions", listOf("btn_cancel", "btn_confirm"), "justify" to "end", "align" to "center"),
                ) + button("btn_cancel", "Cancel", "borderless", "cancel")
                  + button("btn_confirm", "Confirm", "primary", "confirm_transfer", mapOf(
                    "from" to path("/from"), "to" to path("/to"), "amount" to path("/amount"), "date" to path("/date"), "repeat" to path("/repeat"),
                ))),
            ),
        )
    }

    private fun firstOf(v: Any?): String = when (v) {
        is List<*> -> v.firstOrNull()?.toString().orEmpty()
        null -> ""
        else -> v.toString()
    }

    private fun transferDone(surfaceId: String, ctx: Map<String, Any?>): AgentReply {
        val amount = ctx["amount"]?.toString()?.toDoubleOrNull() ?: 0.0
        val from = accounts.firstOrNull { it.key == firstOf(ctx["from"]) }
        val to = accounts.firstOrNull { it.key == firstOf(ctx["to"]) }
        if (from != null && to != null && amount > 0) {
            from.balance = ((from.balance - amount) * 100).roundToLong() / 100.0
            to.balance = ((to.balance + amount) * 100).roundToLong() / 100.0
        }
        val ref = "WBC-${Random.nextInt(1000, 9999)}-${Random.nextInt(100, 999)}"
        val repeat = ctx["repeat"] == true
        val messages = mutableListOf(
            update(surfaceId, listOf(
                card("root", "receipt"),
                column("receipt", listOf("head", "detail", "ref", "again"), "align" to "start"),
                row("head", listOf("tick", "headline"), "align" to "center"),
                icon("tick", "check"),
                text("headline", fmt("Moved \${formatCurrency(value:\${/amount}, currency:\"AUD\")}"), "h3"),
                text("detail", "From **${from?.name ?: "your account"}** to **${to?.name ?: "your account"}**${if (repeat) ", repeating monthly" else ""}. Available immediately."),
                caption("ref", "Reference $ref"),
            ) + button("again", "Move another", "borderless", "transfer_start")),
        )
        // The earlier accounts surface is still on screen. Update its data, not its UI.
        accountsSurface?.let {
            messages += data(it, accountRows(), "/accounts")
            messages += data(it, total(), "/total")
        }
        return AgentReply(
            say = "Done.",
            thinking = listOf("Confirmed with the data model attached", "Replacing the form with a receipt", "Pushing new balances to the accounts surface"),
            messages = messages,
        )
    }

    private fun payReply(): AgentReply {
        val s = sid("pay")
        return AgentReply(
            say = "Who are we paying?",
            thinking = listOf("A short form: payee, amount, note"),
            messages = listOf(
                createSurface(s),
                data(s, mapOf("payee" to "", "amount" to "", "note" to "")),
                update(s, listOf(
                    card("root", "form"),
                    column("form", listOf("title", "payee", "amount", "note", "actions")),
                    text("title", "Pay someone", "h3"),
                    mapOf("id" to "payee", "component" to "TextField", "label" to "Name or PayID", "value" to path("/payee")),
                    mapOf("id" to "amount", "component" to "TextField", "label" to "Amount (AUD)", "variant" to "number", "value" to path("/amount")),
                    mapOf("id" to "note", "component" to "TextField", "label" to "Description (optional)", "value" to path("/note")),
                    row("actions", listOf("btn_cancel", "btn_pay"), "justify" to "end", "align" to "center"),
                ) + button("btn_cancel", "Cancel", "borderless", "cancel")
                  + button("btn_pay", "Pay", "primary", "pay_confirm", mapOf("payee" to path("/payee"), "amount" to path("/amount"), "note" to path("/note")))),
            ),
        )
    }

    private fun payDone(surfaceId: String, ctx: Map<String, Any?>): AgentReply {
        val payee = ctx["payee"]?.toString()?.ifBlank { null } ?: "the payee"
        val note = ctx["note"]?.toString()?.ifBlank { null }
        return AgentReply(
            say = "Sent.",
            messages = listOf(
                update(surfaceId, listOf(
                    card("root", "receipt"),
                    column("receipt", listOf("head", "detail"), "align" to "start"),
                    row("head", listOf("tick", "headline"), "align" to "center"),
                    icon("tick", "check"),
                    text("headline", fmt("Paid \${formatCurrency(value:\${/amount}, currency:\"AUD\")}"), "h3"),
                    text("detail", "To **$payee**${if (note != null) " · “$note”" else ""}. Usually arrives within a minute."),
                )),
            ),
        )
    }

    private fun disputeReply(): AgentReply {
        val s = sid("transactions")
        return AgentReply(
            say = "Here are the latest on your Altitude Black. Tap one you don’t recognise.",
            thinking = listOf("Tabs for posted and pending", "Each row carries its own id in the button context", "The “Not mine?” button is the only thing that reaches me"),
            messages = listOf(
                createSurface(s),
                update(s, listOf(
                    column("root", listOf("heading", "tabs")),
                    text("heading", "Recent on Altitude Black", "h3"),
                    mapOf("id" to "tabs", "component" to "Tabs", "tabs" to listOf(mapOf("title" to "Posted", "child" to "posted"), mapOf("title" to "Pending", "child" to "pending"))),
                    mapOf("id" to "posted", "component" to "List", "children" to mapOf("componentId" to "txn", "path" to "/posted")),
                    mapOf("id" to "pending", "component" to "List", "children" to mapOf("componentId" to "txn", "path" to "/pending")),
                    row("txn", listOf("txn_meta", "txn_side"), "justify" to "spaceBetween", "align" to "center"),
                    column("txn_meta", listOf("txn_merchant", "txn_date")),
                    text("txn_merchant", path("merchant"), "h5"),
                    caption("txn_date", path("date")),
                    row("txn_side", listOf("txn_amount", "txn_btn"), "align" to "center"),
                    text("txn_amount", aud(path("amount"))),
                ) + button("txn_btn", "Not mine?", "borderless", "dispute_start", mapOf("txnId" to path("id"), "merchant" to path("merchant"), "amount" to path("amount")))),
                data(s, mapOf(
                    "posted" to listOf(
                        mapOf("id" to "t1", "merchant" to "Woolworths Metro", "date" to "Tue 28 Oct", "amount" to -42.8),
                        mapOf("id" to "t2", "merchant" to "SP ONLINE*LUX GOODS", "date" to "Mon 27 Oct", "amount" to -1289.0),
                        mapOf("id" to "t3", "merchant" to "Opal top up", "date" to "Mon 27 Oct", "amount" to -50.0),
                        mapOf("id" to "t4", "merchant" to "Single O Surry Hills", "date" to "Sun 26 Oct", "amount" to -6.5),
                    ),
                    "pending" to listOf(mapOf("id" to "t5", "merchant" to "Uber *Trip", "date" to "Today", "amount" to -23.9)),
                )),
            ),
        )
    }

    private fun disputeForm(fromSurface: String, ctx: Map<String, Any?>): AgentReply {
        val s = sid("dispute")
        val merchant = ctx["merchant"]?.toString() ?: "that transaction"
        val amount = ctx["amount"]?.toString()?.toDoubleOrNull() ?: 0.0
        val money = NumberFormat.getCurrencyInstance(Locale("en", "AU")).format(kotlin.math.abs(amount))
        return AgentReply(
            say = "Let’s look at $merchant.",
            thinking = listOf("Opening a second surface rather than mutating the list", "A modal holds the fine print", "Card lock is a checkbox, not a separate flow"),
            messages = listOf(
                createSurface(s),
                data(s, mapOf("reason" to emptyList<String>(), "notes" to "", "lock" to false)),
                update(s, listOf(
                    card("root", "form"),
                    column("form", listOf("title", "sub", "reason", "notes", "lock", "more", "actions")),
                    text("title", "Report a transaction", "h3"),
                    caption("sub", "$merchant · $money"),
                    mapOf(
                        "id" to "reason", "component" to "ChoicePicker", "label" to "What happened?", "variant" to "mutuallyExclusive",
                        "options" to listOf(
                            mapOf("label" to "I didn’t make this purchase", "value" to "unknown"),
                            mapOf("label" to "I was charged twice", "value" to "duplicate"),
                            mapOf("label" to "The amount is wrong", "value" to "amount"),
                            mapOf("label" to "I cancelled this subscription", "value" to "cancelled"),
                        ),
                        "value" to path("/reason"),
                    ),
                    mapOf("id" to "notes", "component" to "TextField", "label" to "Anything else?", "variant" to "longText", "value" to path("/notes")),
                    mapOf("id" to "lock", "component" to "CheckBox", "label" to "Lock my card while you look into it", "value" to path("/lock")),
                    mapOf("id" to "more", "component" to "Modal", "trigger" to "more_btn", "content" to "more_body"),
                ) + button("more_btn", "What happens next?", "borderless", "open_details") + listOf(
                    column("more_body", listOf("more_title", "more_text")),
                    text("more_title", "What happens next", "h4"),
                    text("more_text", "1. We open a case and text you a reference.\n2. A temporary credit lands within **2 business days** while we investigate.\n3. If the merchant disagrees, we may ask for more detail.\n\nYou can keep using your card unless you chose to lock it."),
                    row("actions", listOf("btn_cancel", "btn_submit"), "justify" to "end", "align" to "center"),
                ) + button("btn_cancel", "Not now", "borderless", "cancel")
                  + button("btn_submit", "Report it", "primary", "dispute_submit", mapOf(
                    "txnId" to ctx["txnId"], "merchant" to merchant, "reason" to path("/reason"), "notes" to path("/notes"), "lock" to path("/lock"), "listSurface" to fromSurface,
                ))),
            ),
        )
    }

    private fun disputeDone(surfaceId: String, ctx: Map<String, Any?>): AgentReply {
        val locked = ctx["lock"] == true
        val caseRef = "WBC-DSP-${Random.nextInt(10000, 99999)}"
        val messages = mutableListOf(
            update(surfaceId, listOf(
                card("root", "receipt"),
                column("receipt", listOf("head", "detail", "ref"), "align" to "start"),
                row("head", listOf("tick", "headline"), "align" to "center"),
                icon("tick", "check"),
                text("headline", "Reported", "h3"),
                text("detail", "We’ll text you within 2 business days.${if (locked) " Your **Altitude Black is locked**; unlock it any time in the app." else ""}"),
                caption("ref", "Case $caseRef"),
            )),
        )
        val list = ctx["listSurface"] as? String
        if (list != null && ctx["txnId"] == "t2") {
            messages += data(list, "SP ONLINE*LUX GOODS · under review", "/posted/1/merchant")
        }
        return AgentReply(
            say = "Thanks, that’s lodged.",
            thinking = listOf("Replacing the form with a receipt", "Annotating the row in the original list by data path"),
            messages = messages,
        )
    }

    private fun depositReply(): AgentReply {
        val s = sid("deposit")
        return AgentReply(
            say = "Pick an amount and a term. I’ll estimate the interest when you ask.",
            thinking = listOf("Slider and chips for the two inputs", "The maths stays on my side: “Update estimate” sends me the data model", "Product fine print in a modal"),
            messages = listOf(
                createSurface(s),
                data(s, mapOf("amount" to 25000, "term" to listOf("12"), "rate" to "4.10%", "interest" to 1025)),
                update(s, listOf(
                    card("root", "form"),
                    column("form", listOf("title", "amount", "term", "rule", "figures", "pds", "actions")),
                    text("title", "Term deposit", "h3"),
                    mapOf("id" to "amount", "component" to "Slider", "label" to "Amount (AUD)", "min" to 5000, "max" to 100000, "value" to path("/amount")),
                    mapOf(
                        "id" to "term", "component" to "ChoicePicker", "label" to "Term", "displayStyle" to "chips", "variant" to "mutuallyExclusive",
                        "options" to listOf("3", "6", "12", "24").map { mapOf("label" to "$it months", "value" to it) },
                        "value" to path("/term"),
                    ),
                    divider("rule"),
                    row("figures", listOf("rate_col", "interest_col", "estimate"), "justify" to "spaceBetween", "align" to "end"),
                    column("rate_col", listOf("rate_label", "rate")),
                    caption("rate_label", "Rate p.a."),
                    text("rate", path("/rate"), "h4"),
                    column("interest_col", listOf("interest_label", "interest")),
                    caption("interest_label", "Interest at maturity"),
                    text("interest", aud(path("/interest")), "h4"),
                ) + button("estimate", "Update estimate", "default", "td_estimate", mapOf("amount" to path("/amount"), "term" to path("/term"))) + listOf(
                    mapOf("id" to "pds", "component" to "Modal", "trigger" to "pds_btn", "content" to "pds_body"),
                ) + button("pds_btn", "Read the summary", "borderless", "open_details") + listOf(
                    column("pds_body", listOf("pds_title", "pds_text")),
                    text("pds_title", "Before you open", "h4"),
                    text("pds_text", "- Interest is paid at maturity for terms up to 12 months.\n- Withdrawing early needs **31 days’ notice** and reduces the rate.\n- Rates shown are illustrative for this prototype, not an offer."),
                    row("actions", listOf("btn_open"), "justify" to "end"),
                ) + button("btn_open", "Open deposit", "primary", "td_open", mapOf("amount" to path("/amount"), "term" to path("/term")))),
            ),
        )
    }

    private fun rateFor(term: Int): Double = mapOf(3 to 3.8, 6 to 4.0, 12 to 4.1, 24 to 4.25)[term] ?: 4.0

    private fun depositEstimate(surfaceId: String, ctx: Map<String, Any?>): AgentReply {
        val amount = ctx["amount"]?.toString()?.toDoubleOrNull() ?: 0.0
        val term = firstOf(ctx["term"]).toIntOrNull() ?: 12
        val rate = rateFor(term)
        val interest = ((amount * rate / 100) * (term / 12.0) * 100).roundToLong() / 100.0
        return AgentReply(
            thinking = listOf("$term months at $rate% p.a."),
            messages = listOf(data(surfaceId, String.format(Locale.ROOT, "%.2f%%", rate), "/rate"), data(surfaceId, interest, "/interest")),
        )
    }

    private fun depositDone(surfaceId: String, ctx: Map<String, Any?>): AgentReply {
        val term = firstOf(ctx["term"]).toIntOrNull() ?: 12
        val matures = LocalDate.now().plusMonths(term.toLong()).format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale("en", "AU")))
        return AgentReply(
            say = "Opened.",
            messages = listOf(
                update(surfaceId, listOf(
                    card("root", "receipt"),
                    column("receipt", listOf("head", "detail"), "align" to "start"),
                    row("head", listOf("tick", "headline"), "align" to "center"),
                    icon("tick", "check"),
                    text("headline", fmt("\${formatCurrency(value:\${/amount}, currency:\"AUD\")} locked in"), "h3"),
                    text("detail", "Matures **$matures** at ${String.format(Locale.ROOT, "%.2f", rateFor(term))}% p.a. Funds come from Westpac eSaver."),
                )),
            ),
        )
    }
}
