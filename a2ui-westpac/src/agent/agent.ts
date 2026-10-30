/**
 * A scripted stand-in for an agent. It never writes HTML: it replies with
 * A2UI envelopes, and it reacts to the actions the surfaces send back.
 *
 * Everything here is fictional. Account names borrow Westpac product names
 * because the experiment is about Westpac's design language; the numbers,
 * references and people are invented.
 */
import type {A2uiMessage, ActionLike, AgentReply, Scenario} from './types.js';
import {aud, button, caption, card, column, check, createSurface, data, divider, fmt, icon, path, required, row, text, update} from './compose.js';

export const SCENARIOS: Scenario[] = [
  {id: 'accounts', title: 'Accounts', prompt: 'What’s in my accounts?', match: /account|balance|money|how much/i},
  {id: 'transfer', title: 'Move money', prompt: 'Move $500 from Choice to eSaver', match: /move|transfer|send|\$\d/i},
  {id: 'dispute', title: 'Dispute', prompt: 'I don’t recognise a transaction', match: /recogni[sz]e|dispute|fraud|charge|transaction/i},
  {id: 'deposit', title: 'Term deposit', prompt: 'Set up a term deposit', match: /deposit|save|interest|rate/i},
];

interface Account {
  key: string;
  name: string;
  number: string;
  balance: number;
}

export class MockAgent {
  private seq = 0;
  private accountsSurface?: string;
  private accounts: Account[] = [
    {key: 'choice', name: 'Westpac Choice', number: '032-000 12 3456', balance: 2419.55},
    {key: 'esaver', name: 'Westpac eSaver', number: '032-000 98 7654', balance: 18250.0},
    {key: 'altitude', name: 'Altitude Black', number: '•••• •••• •••• 4431', balance: -812.4},
  ];

  private sid(prefix: string) {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  /** Reply to a typed message. Unknown requests get a menu, not a guess. */
  respond(input: string): AgentReply {
    const amount = /\$\s?(\d[\d,]*(?:\.\d+)?)/.exec(input);
    const scenario = SCENARIOS.find(s => s.match.test(input));
    switch (scenario?.id) {
      case 'accounts':
        return this.accountsReply();
      case 'transfer':
        return this.transferReply(amount ? Number(amount[1].replace(/,/g, '')) : 500);
      case 'dispute':
        return this.disputeReply();
      case 'deposit':
        return this.depositReply();
      default:
        return this.menuReply();
    }
  }

  /** Reply to an action a surface dispatched. */
  respondToAction(action: ActionLike): AgentReply | undefined {
    const ctx = action.context ?? {};
    switch (action.name) {
      case 'choose':
        return this.respond(String(ctx.prompt ?? ''));
      case 'transfer_start':
        return this.transferReply(500);
      case 'pay_start':
        return this.payReply();
      case 'confirm_transfer':
        return this.transferDone(action.surfaceId, ctx);
      case 'cancel':
        return {say: 'No worries, nothing moved.', messages: [{version: 'v0.9', deleteSurface: {surfaceId: action.surfaceId}}]};
      case 'dispute_start':
        return this.disputeForm(action.surfaceId, ctx);
      case 'dispute_submit':
        return this.disputeDone(action.surfaceId, ctx);
      case 'td_estimate':
        return this.depositEstimate(action.surfaceId, ctx);
      case 'td_open':
        return this.depositDone(action.surfaceId, ctx);
      case 'pay_confirm':
        return this.payDone(action.surfaceId, ctx);
      default:
        return undefined;
    }
  }

  // ---------------------------------------------------------------------------

  private menuReply(): AgentReply {
    const s = this.sid('menu');
    return {
      say: 'I can show you a few things. Pick one and I’ll build it.',
      thinking: ['No intent matched', 'Offering the catalog of things I can do'],
      messages: [
        createSurface(s),
        update(s, [
          column('root', ['title', 'options']),
          text('title', 'Here’s what I can do', 'h4'),
          column('options', SCENARIOS.map(x => `opt_${x.id}`), {align: 'start'}),
          ...SCENARIOS.flatMap(x => button(`opt_${x.id}`, x.prompt, 'borderless', 'choose', {prompt: x.prompt})),
        ]),
      ],
    };
  }

  private accountsReply(): AgentReply {
    const s = this.sid('accounts');
    this.accountsSurface = s;
    const total = this.accounts.reduce((a, b) => a + b.balance, 0);
    return {
      say: 'Here’s where everything sits right now.',
      thinking: ['Fetching three accounts', 'A list template keeps the component count flat', 'Money is formatted by the client, not by me'],
      messages: [
        createSurface(s),
        update(s, [column('root', ['heading', 'list']), text('heading', 'Your accounts', 'h3'), {id: 'list', component: 'List', children: {componentId: 'acct', path: '/accounts'}}]),
        update(s, [
          card('acct', 'acct_row'),
          row('acct_row', ['acct_meta', 'acct_balance'], {justify: 'spaceBetween', align: 'center'}),
          column('acct_meta', ['acct_name', 'acct_number']),
          text('acct_name', path('name'), 'h5'),
          caption('acct_number', path('number')),
          text('acct_balance', aud(path('balance')), 'h4'),
        ]),
        data(s, {accounts: this.accounts.map(({name, number, balance}) => ({name, number, balance})), total}),
        update(s, [
          column('root', ['heading', 'list', 'total', 'actions']),
          row('total', ['total_label', 'total_value'], {justify: 'spaceBetween', align: 'center'}),
          caption('total_label', 'Net position'),
          text('total_value', aud(path('/total')), 'h4'),
          row('actions', ['btn_transfer', 'btn_pay'], {justify: 'start'}),
          ...button('btn_transfer', 'Move money', 'primary', 'transfer_start'),
          ...button('btn_pay', 'Pay someone', 'default', 'pay_start'),
        ]),
      ],
    };
  }

  private transferReply(amount: number): AgentReply {
    const s = this.sid('transfer');
    const today = new Date().toISOString().slice(0, 10);
    return {
      say: 'Check the details and confirm.',
      thinking: ['Two accounts, an amount, a date', 'Validation runs on the client via catalog functions', 'I only hear back when Confirm is pressed'],
      messages: [
        createSurface(s),
        data(s, {from: ['choice'], to: ['esaver'], amount, date: today, repeat: false}),
        update(s, [
          card('root', 'form'),
          column('form', ['title', 'from', 'to', 'amount', 'when', 'repeat', 'rule', 'actions']),
          text('title', 'Move money', 'h3'),
          {
            id: 'from',
            component: 'ChoicePicker',
            label: 'From',
            displayStyle: 'chips',
            variant: 'mutuallyExclusive',
            options: this.accounts.map(a => ({label: a.name, value: a.key})),
            value: path('/from'),
          },
          {
            id: 'to',
            component: 'ChoicePicker',
            label: 'To',
            displayStyle: 'chips',
            variant: 'mutuallyExclusive',
            options: this.accounts.map(a => ({label: a.name, value: a.key})),
            value: path('/to'),
          },
          {
            id: 'amount',
            component: 'TextField',
            label: 'Amount (AUD)',
            variant: 'number',
            value: path('/amount'),
            checks: [required('/amount', 'Enter an amount.'), check('numeric', {value: path('/amount'), min: 0.01}, 'Amount must be positive.')],
          },
          {id: 'when', component: 'DateTimeInput', label: 'When', enableDate: true, value: path('/date')},
          {id: 'repeat', component: 'CheckBox', label: 'Repeat monthly', value: path('/repeat')},
          divider('rule'),
          row('actions', ['btn_cancel', 'btn_confirm'], {justify: 'end', align: 'center'}),
          ...button('btn_cancel', 'Cancel', 'borderless', 'cancel'),
          ...button('btn_confirm', 'Confirm', 'primary', 'confirm_transfer', {
            from: path('/from'),
            to: path('/to'),
            amount: path('/amount'),
            date: path('/date'),
            repeat: path('/repeat'),
          }),
        ]),
      ],
    };
  }

  private transferDone(surfaceId: string, ctx: Record<string, unknown>): AgentReply {
    const amount = Number(ctx.amount ?? 0);
    const fromKey = Array.isArray(ctx.from) ? String(ctx.from[0]) : String(ctx.from ?? '');
    const toKey = Array.isArray(ctx.to) ? String(ctx.to[0]) : String(ctx.to ?? '');
    const from = this.accounts.find(a => a.key === fromKey);
    const to = this.accounts.find(a => a.key === toKey);
    if (from && to && amount > 0) {
      from.balance = Math.round((from.balance - amount) * 100) / 100;
      to.balance = Math.round((to.balance + amount) * 100) / 100;
    }
    const ref = `WBC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;
    const messages: A2uiMessage[] = [
      update(surfaceId, [
        card('root', 'receipt'),
        column('receipt', ['head', 'detail', 'ref', 'again'], {align: 'start'}),
        row('head', ['tick', 'headline'], {align: 'center'}),
        icon('tick', 'check'),
        text('headline', fmt('Moved ${formatCurrency(value:${/amount}, currency:"AUD")}'), 'h3'),
        text('detail', `From **${from?.name ?? 'your account'}** to **${to?.name ?? 'your account'}**${ctx.repeat ? ', repeating monthly' : ''}. Available immediately.`),
        caption('ref', `Reference ${ref}`),
        ...button('again', 'Move another', 'borderless', 'transfer_start'),
      ]),
    ];
    // The earlier accounts surface is still on screen. Update its data, not its UI.
    if (this.accountsSurface) {
      const total = this.accounts.reduce((a, b) => a + b.balance, 0);
      messages.push(data(this.accountsSurface, this.accounts.map(({name, number, balance}) => ({name, number, balance})), '/accounts'));
      messages.push(data(this.accountsSurface, total, '/total'));
    }
    return {say: 'Done.', thinking: ['Confirmed with the data model attached', 'Replacing the form with a receipt', 'Pushing new balances to the accounts surface'], messages};
  }

  private payReply(): AgentReply {
    const s = this.sid('pay');
    return {
      say: 'Who are we paying?',
      thinking: ['A short form: payee, amount, note'],
      messages: [
        createSurface(s),
        data(s, {payee: '', amount: '', note: ''}),
        update(s, [
          card('root', 'form'),
          column('form', ['title', 'payee', 'amount', 'note', 'actions']),
          text('title', 'Pay someone', 'h3'),
          {id: 'payee', component: 'TextField', label: 'Name or PayID', value: path('/payee')},
          {id: 'amount', component: 'TextField', label: 'Amount (AUD)', variant: 'number', value: path('/amount')},
          {id: 'note', component: 'TextField', label: 'Description (optional)', value: path('/note')},
          row('actions', ['btn_cancel', 'btn_pay'], {justify: 'end', align: 'center'}),
          ...button('btn_cancel', 'Cancel', 'borderless', 'cancel'),
          ...button('btn_pay', 'Pay', 'primary', 'pay_confirm', {payee: path('/payee'), amount: path('/amount'), note: path('/note')}),
        ]),
      ],
    };
  }

  private payDone(surfaceId: string, ctx: Record<string, unknown>): AgentReply {
    return {
      say: 'Sent.',
      messages: [
        update(surfaceId, [
          card('root', 'receipt'),
          column('receipt', ['head', 'detail'], {align: 'start'}),
          row('head', ['tick', 'headline'], {align: 'center'}),
          icon('tick', 'check'),
          text('headline', fmt('Paid ${formatCurrency(value:${/amount}, currency:"AUD")}'), 'h3'),
          text('detail', `To **${String(ctx.payee || 'the payee')}**${ctx.note ? ` · “${String(ctx.note)}”` : ''}. Usually arrives within a minute.`),
        ]),
      ],
    };
  }

  private disputeReply(): AgentReply {
    const s = this.sid('transactions');
    return {
      say: 'Here are the latest on your Altitude Black. Tap one you don’t recognise.',
      thinking: ['Tabs for posted and pending', 'Each row carries its own id in the button context', 'The “Not mine?” button is the only thing that reaches me'],
      messages: [
        createSurface(s),
        update(s, [
          column('root', ['heading', 'tabs']),
          text('heading', 'Recent on Altitude Black', 'h3'),
          {id: 'tabs', component: 'Tabs', tabs: [{title: 'Posted', child: 'posted'}, {title: 'Pending', child: 'pending'}]},
          {id: 'posted', component: 'List', children: {componentId: 'txn', path: '/posted'}},
          {id: 'pending', component: 'List', children: {componentId: 'txn', path: '/pending'}},
          row('txn', ['txn_meta', 'txn_side'], {justify: 'spaceBetween', align: 'center'}),
          column('txn_meta', ['txn_merchant', 'txn_date']),
          text('txn_merchant', path('merchant'), 'h5'),
          caption('txn_date', path('date')),
          row('txn_side', ['txn_amount', 'txn_btn'], {align: 'center'}),
          text('txn_amount', aud(path('amount'))),
          ...button('txn_btn', 'Not mine?', 'borderless', 'dispute_start', {txnId: path('id'), merchant: path('merchant'), amount: path('amount')}),
        ]),
        data(s, {
          posted: [
            {id: 't1', merchant: 'Woolworths Metro', date: 'Tue 28 Oct', amount: -42.8},
            {id: 't2', merchant: 'SP ONLINE*LUX GOODS', date: 'Mon 27 Oct', amount: -1289.0},
            {id: 't3', merchant: 'Opal top up', date: 'Mon 27 Oct', amount: -50.0},
            {id: 't4', merchant: 'Single O Surry Hills', date: 'Sun 26 Oct', amount: -6.5},
          ],
          pending: [{id: 't5', merchant: 'Uber *Trip', date: 'Today', amount: -23.9}],
        }),
      ],
    };
  }

  private disputeForm(fromSurface: string, ctx: Record<string, unknown>): AgentReply {
    const s = this.sid('dispute');
    const merchant = String(ctx.merchant ?? 'that transaction');
    const amount = Number(ctx.amount ?? 0);
    return {
      say: `Let’s look at ${merchant}.`,
      thinking: ['Opening a second surface rather than mutating the list', 'A modal holds the fine print', 'Card lock is a checkbox, not a separate flow'],
      messages: [
        createSurface(s),
        data(s, {reason: [], notes: '', lock: false}),
        update(s, [
          card('root', 'form'),
          column('form', ['title', 'sub', 'reason', 'notes', 'lock', 'more', 'actions']),
          text('title', 'Report a transaction', 'h3'),
          caption('sub', `${merchant} · ${new Intl.NumberFormat('en-AU', {style: 'currency', currency: 'AUD'}).format(Math.abs(amount))}`),
          {
            id: 'reason',
            component: 'ChoicePicker',
            label: 'What happened?',
            variant: 'mutuallyExclusive',
            options: [
              {label: 'I didn’t make this purchase', value: 'unknown'},
              {label: 'I was charged twice', value: 'duplicate'},
              {label: 'The amount is wrong', value: 'amount'},
              {label: 'I cancelled this subscription', value: 'cancelled'},
            ],
            value: path('/reason'),
          },
          {id: 'notes', component: 'TextField', label: 'Anything else?', variant: 'longText', value: path('/notes')},
          {id: 'lock', component: 'CheckBox', label: 'Lock my card while you look into it', value: path('/lock')},
          {id: 'more', component: 'Modal', trigger: 'more_btn', content: 'more_body'},
          ...button('more_btn', 'What happens next?', 'borderless', 'open_details'),
          column('more_body', ['more_title', 'more_text']),
          text('more_title', 'What happens next', 'h4'),
          text('more_text', '1. We open a case and text you a reference.\n2. A temporary credit lands within **2 business days** while we investigate.\n3. If the merchant disagrees, we may ask for more detail.\n\nYou can keep using your card unless you chose to lock it.'),
          row('actions', ['btn_cancel', 'btn_submit'], {justify: 'end', align: 'center'}),
          ...button('btn_cancel', 'Not now', 'borderless', 'cancel'),
          ...button('btn_submit', 'Report it', 'primary', 'dispute_submit', {
            txnId: ctx.txnId,
            merchant,
            reason: path('/reason'),
            notes: path('/notes'),
            lock: path('/lock'),
            listSurface: fromSurface,
          }),
        ]),
      ],
    };
  }

  private disputeDone(surfaceId: string, ctx: Record<string, unknown>): AgentReply {
    const locked = Boolean(ctx.lock);
    const caseRef = `WBC-DSP-${Math.floor(10000 + Math.random() * 89999)}`;
    const messages: A2uiMessage[] = [
      update(surfaceId, [
        card('root', 'receipt'),
        column('receipt', ['head', 'detail', 'ref'], {align: 'start'}),
        row('head', ['tick', 'headline'], {align: 'center'}),
        icon('tick', 'check'),
        text('headline', 'Reported', 'h3'),
        text('detail', `We’ll text you within 2 business days.${locked ? ' Your **Altitude Black is locked**; unlock it any time in the app.' : ''}`),
        caption('ref', `Case ${caseRef}`),
      ]),
    ];
    const list = typeof ctx.listSurface === 'string' ? ctx.listSurface : undefined;
    if (list && ctx.txnId === 't2') {
      messages.push(data(list, 'SP ONLINE*LUX GOODS · under review', '/posted/1/merchant'));
    }
    return {say: 'Thanks, that’s lodged.', thinking: ['Replacing the form with a receipt', 'Annotating the row in the original list by data path'], messages};
  }

  private depositReply(): AgentReply {
    const s = this.sid('deposit');
    return {
      say: 'Pick an amount and a term. I’ll estimate the interest when you ask.',
      thinking: ['Slider and chips for the two inputs', 'The maths stays on my side: “Update estimate” sends me the data model', 'Product fine print in a modal'],
      messages: [
        createSurface(s),
        // Data first: the figures bind functions to paths, and the spec allows any order.
        data(s, {amount: 25000, term: ['12'], rate: '4.10%', interest: 1025}),
        update(s, [
          card('root', 'form'),
          column('form', ['title', 'amount', 'term', 'rule', 'figures', 'pds', 'actions']),
          text('title', 'Term deposit', 'h3'),
          {id: 'amount', component: 'Slider', label: 'Amount (AUD)', min: 5000, max: 100000, value: path('/amount')},
          {
            id: 'term',
            component: 'ChoicePicker',
            label: 'Term',
            displayStyle: 'chips',
            variant: 'mutuallyExclusive',
            options: [
              {label: '3 months', value: '3'},
              {label: '6 months', value: '6'},
              {label: '12 months', value: '12'},
              {label: '24 months', value: '24'},
            ],
            value: path('/term'),
          },
          divider('rule'),
          row('figures', ['rate_col', 'interest_col', 'estimate'], {justify: 'spaceBetween', align: 'end'}),
          column('rate_col', ['rate_label', 'rate']),
          caption('rate_label', 'Rate p.a.'),
          text('rate', path('/rate'), 'h4'),
          column('interest_col', ['interest_label', 'interest']),
          caption('interest_label', 'Interest at maturity'),
          text('interest', aud(path('/interest')), 'h4'),
          ...button('estimate', 'Update estimate', 'default', 'td_estimate', {amount: path('/amount'), term: path('/term')}),
          {id: 'pds', component: 'Modal', trigger: 'pds_btn', content: 'pds_body'},
          ...button('pds_btn', 'Read the summary', 'borderless', 'open_details'),
          column('pds_body', ['pds_title', 'pds_text']),
          text('pds_title', 'Before you open', 'h4'),
          text('pds_text', '- Interest is paid at maturity for terms up to 12 months.\n- Withdrawing early needs **31 days’ notice** and reduces the rate.\n- Rates shown are illustrative for this prototype, not an offer.'),
          row('actions', ['btn_open'], {justify: 'end'}),
          ...button('btn_open', 'Open deposit', 'primary', 'td_open', {amount: path('/amount'), term: path('/term')}),
        ]),
      ],
    };
  }

  private static rateFor(term: number): number {
    return {3: 3.8, 6: 4.0, 12: 4.1, 24: 4.25}[term] ?? 4.0;
  }

  private depositEstimate(surfaceId: string, ctx: Record<string, unknown>): AgentReply {
    const amount = Number(ctx.amount ?? 0);
    const term = Number(Array.isArray(ctx.term) ? ctx.term[0] : ctx.term) || 12;
    const rate = MockAgent.rateFor(term);
    const interest = Math.round(((amount * rate) / 100) * (term / 12) * 100) / 100;
    return {
      thinking: [`${term} months at ${rate}% p.a.`],
      messages: [data(surfaceId, `${rate.toFixed(2)}%`, '/rate'), data(surfaceId, interest, '/interest')],
    };
  }

  private depositDone(surfaceId: string, ctx: Record<string, unknown>): AgentReply {
    const term = Number(Array.isArray(ctx.term) ? ctx.term[0] : ctx.term) || 12;
    const matures = new Date();
    matures.setMonth(matures.getMonth() + term);
    return {
      say: 'Opened.',
      messages: [
        update(surfaceId, [
          card('root', 'receipt'),
          column('receipt', ['head', 'detail'], {align: 'start'}),
          row('head', ['tick', 'headline'], {align: 'center'}),
          icon('tick', 'check'),
          text('headline', fmt('${formatCurrency(value:${/amount}, currency:"AUD")} locked in'), 'h3'),
          text('detail', `Matures **${matures.toLocaleDateString('en-AU', {day: 'numeric', month: 'long', year: 'numeric'})}** at ${MockAgent.rateFor(term).toFixed(2)}% p.a. Funds come from Westpac eSaver.`),
        ]),
      ],
    };
  }
}
