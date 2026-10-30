import {LitElement, html, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {MessageProcessor, type SurfaceModel} from '@a2ui/web_core/v0_9';
import type {ActionPayload} from '@a2ui/web_core/state';
import '@a2ui/lit/v0_9';
import '@material/web/button/filled-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

import {westpacCatalog, referenceCatalog} from '../catalog/index.js';
import {MockAgent, SCENARIOS} from '../agent/agent.js';
import type {A2uiMessage, AgentReply} from '../agent/types.js';
import {premise} from './premise.js';

type Renderer = 'westpac' | 'baseline' | 'reference';
type Mode = 'light' | 'dark';
type Tab = 'premise' | 'stream' | 'data' | 'send';

interface Turn {
  id: number;
  role: 'user' | 'agent';
  text?: string;
  thinking: string[];
  surfaceIds: string[];
}

interface StreamEntry {
  id: number;
  dir: 'in' | 'out' | 'you' | 'error';
  at: Date;
  body: unknown;
  label: string;
  surfaceId?: string;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type Payload = Parameters<MessageProcessor['processMessages']>[0];
/** The processor validates at runtime; the mock agent's envelopes are deliberately untyped. */
const payload = (msg: A2uiMessage): Payload => structuredClone(msg) as unknown as Payload;

function describe(msg: A2uiMessage): {label: string; surfaceId?: string} {
  for (const k of ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'] as const) {
    const body = msg[k] as {surfaceId?: string; components?: unknown[]; path?: string} | undefined;
    if (!body) continue;
    let label = k;
    if (k === 'updateComponents') label += ` ×${body.components?.length ?? 0}`;
    if (k === 'updateDataModel' && body.path) label += ` ${body.path}`;
    return {label, surfaceId: body.surfaceId};
  }
  return {label: 'message'};
}

@customElement('a2w-shell')
export class A2wShell extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @state() private renderer: Renderer = 'westpac';
  @state() private mode: Mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  @state() private tab: Tab = 'premise';
  @state() private turns: Turn[] = [];
  @state() private stream: StreamEntry[] = [];
  @state() private surfaces = new Map<string, SurfaceModel>();
  @state() private speed = 1;
  @state() private manual = false;
  @state() private pending = 0;
  @state() private busy = false;
  @state() private draft = '';
  @state() private sendDraft = '';
  @state() private sendError = '';
  @state() private dataText = new Map<string, string>();
  @state() private inspectorOpen = matchMedia('(min-width: 900px)').matches;

  private agent = new MockAgent();
  private processor!: MessageProcessor;
  private seq = 0;
  private stepResolvers: Array<() => void> = [];
  private dataSubs = new Map<string, {unsubscribe(): void}>();
  private history: Array<{msg: A2uiMessage; dir: 'in' | 'you'}> = [];

  override connectedCallback() {
    super.connectedCallback();
    this.applyDocumentAttrs();
    this.buildProcessor();
    const scenario = SCENARIOS[0];
    void this.send(scenario.prompt);
  }

  private applyDocumentAttrs() {
    document.documentElement.dataset.skin = this.renderer;
    document.documentElement.dataset.mode = this.mode;
  }

  private buildProcessor() {
    const catalog = this.renderer === 'reference' ? referenceCatalog : westpacCatalog;
    this.processor = new MessageProcessor([catalog], (a: ActionPayload) => this.onAction(a));
    this.processor.model.onSurfaceCreated.subscribe(surface => {
      this.surfaces = new Map(this.surfaces).set(surface.id, surface);
      const sub = surface.dataModel.subscribe<unknown>('/', value => {
        this.dataText = new Map(this.dataText).set(surface.id, JSON.stringify(value ?? {}, null, 2));
      });
      this.dataSubs.set(surface.id, sub);
      surface.onError.subscribe(err => this.logError(`Surface ${surface.id}: ${err.message ?? String(err)}`));
    });
    this.processor.model.onSurfaceDeleted.subscribe(id => {
      const next = new Map(this.surfaces);
      next.delete(id);
      this.surfaces = next;
      this.dataSubs.get(id)?.unsubscribe();
      this.dataSubs.delete(id);
    });
  }

  /** Swap renderers: new processor, same bytes replayed. */
  private setRenderer(renderer: Renderer) {
    if (renderer === this.renderer) return;
    const needsRebuild = renderer === 'reference' || this.renderer === 'reference';
    this.renderer = renderer;
    this.applyDocumentAttrs();
    if (!needsRebuild) return;
    for (const sub of this.dataSubs.values()) sub.unsubscribe();
    this.dataSubs.clear();
    this.processor.model.dispose();
    this.surfaces = new Map();
    this.buildProcessor();
    for (const {msg} of this.history) {
      try {
        this.processor.processMessages(payload(msg));
      } catch (e) {
        this.logError(String(e));
      }
    }
  }

  private setMode(mode: Mode) {
    this.mode = mode;
    this.applyDocumentAttrs();
  }

  private log(entry: Omit<StreamEntry, 'id' | 'at'>) {
    this.seq += 1;
    this.stream = [...this.stream, {...entry, id: this.seq, at: new Date()}];
  }

  private logError(message: string) {
    this.log({dir: 'error', body: message, label: 'error'});
  }

  private apply(msg: A2uiMessage, dir: 'in' | 'you') {
    const {label, surfaceId} = describe(msg);
    this.log({dir, body: msg, label, surfaceId});
    this.history.push({msg: structuredClone(msg), dir});
    try {
      this.processor.processMessages(payload(msg));
    } catch (e) {
      this.logError(String(e));
    }
  }

  private async gate() {
    if (!this.manual) {
      await sleep(320 / this.speed);
      return;
    }
    this.pending += 1;
    await new Promise<void>(resolve => this.stepResolvers.push(resolve));
    this.pending -= 1;
  }

  private step() {
    this.stepResolvers.shift()?.();
  }

  private flush() {
    const all = this.stepResolvers.splice(0);
    all.forEach(r => r());
  }

  private async play(reply: AgentReply) {
    this.seq += 1;
    const turn: Turn = {id: this.seq, role: 'agent', text: reply.say, thinking: [], surfaceIds: []};
    this.turns = [...this.turns, turn];
    const refresh = () => (this.turns = [...this.turns]);
    for (const line of reply.thinking ?? []) {
      await sleep(360 / this.speed);
      turn.thinking.push(line);
      refresh();
    }
    for (const msg of reply.messages) {
      await this.gate();
      this.apply(msg, 'in');
      const created = (msg.createSurface as {surfaceId?: string} | undefined)?.surfaceId;
      if (created) {
        turn.surfaceIds.push(created);
        refresh();
      }
    }
  }

  private async send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || this.busy) return;
    this.busy = true;
    this.draft = '';
    this.seq += 1;
    this.turns = [...this.turns, {id: this.seq, role: 'user', text: trimmed, thinking: [], surfaceIds: []}];
    await sleep(200);
    try {
      await this.play(this.agent.respond(trimmed));
    } finally {
      this.busy = false;
      this.scrollTranscript();
    }
  }

  private onAction(action: ActionPayload) {
    this.log({
      dir: 'out',
      body: {name: action.name, surfaceId: action.surfaceId, sourceComponentId: action.sourceComponentId, context: action.context},
      label: `action ${action.name}`,
      surfaceId: action.surfaceId,
    });
    const reply = this.agent.respondToAction({
      name: action.name,
      surfaceId: action.surfaceId,
      sourceComponentId: action.sourceComponentId,
      context: action.context,
    });
    if (reply) void this.play(reply).then(() => this.scrollTranscript());
  }

  private scrollTranscript() {
    requestAnimationFrame(() => {
      const el = this.querySelector('.transcript');
      el?.scrollTo({top: el.scrollHeight, behavior: 'smooth'});
    });
  }

  override updated() {
    if (this.busy) this.scrollTranscript();
  }

  private applyData(surfaceId: string) {
    const text = this.dataText.get(surfaceId) ?? '{}';
    try {
      const value = JSON.parse(text);
      this.apply({version: 'v0.9', updateDataModel: {surfaceId, value}}, 'you');
    } catch (e) {
      this.logError(`Data for ${surfaceId}: ${(e as Error).message}`);
    }
  }

  private sendRaw() {
    this.sendError = '';
    const lines = this.sendDraft
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    try {
      const msgs = lines.map(l => JSON.parse(l) as A2uiMessage);
      for (const m of msgs) {
        if (!m.version) m.version = 'v0.9';
        const created = (m.createSurface as {surfaceId?: string} | undefined)?.surfaceId;
        this.apply(m, 'you');
        if (created) {
          this.seq += 1;
          this.turns = [...this.turns, {id: this.seq, role: 'agent', text: 'From the Send tab.', thinking: [], surfaceIds: [created]}];
        }
      }
      this.sendDraft = '';
      this.scrollTranscript();
    } catch (e) {
      this.sendError = (e as Error).message;
    }
  }

  private reset() {
    this.flush();
    for (const id of Array.from(this.surfaces.keys())) {
      this.apply({version: 'v0.9', deleteSurface: {surfaceId: id}}, 'you');
    }
    this.turns = [];
    this.stream = [];
    this.history = [];
    this.agent = new MockAgent();
  }

  // ---------------------------------------------------------------------------

  override render() {
    return html`
      <header class="topbar">
        <div class="brand">
          <span class="brand-title">Agent → Interface</span>
          <span class="brand-sub">A2UI · Material 3 · Westpac GEL</span>
        </div>
        <div class="controls">
          <div class="seg" role="radiogroup" aria-label="Renderer">
            ${(
              [
                ['westpac', 'Westpac GEL'],
                ['baseline', 'Material baseline'],
                ['reference', 'A2UI reference'],
              ] as const
            ).map(
              ([v, l]) => html`<button
                role="radio"
                aria-checked=${this.renderer === v}
                class=${this.renderer === v ? 'on' : ''}
                @click=${() => this.setRenderer(v)}
              >
                ${l}
              </button>`,
            )}
          </div>
          <div class="seg" role="radiogroup" aria-label="Colour scheme">
            <button role="radio" aria-checked=${this.mode === 'light'} class=${this.mode === 'light' ? 'on' : ''} @click=${() => this.setMode('light')}>Light</button>
            <button role="radio" aria-checked=${this.mode === 'dark'} class=${this.mode === 'dark' ? 'on' : ''} @click=${() => this.setMode('dark')}>Dark</button>
          </div>
          <button class="ghost" @click=${() => (this.inspectorOpen = !this.inspectorOpen)} aria-pressed=${this.inspectorOpen}>
            ${this.inspectorOpen ? 'Hide inspector' : 'Inspector'}
          </button>
        </div>
      </header>

      <main class=${this.inspectorOpen ? 'split' : 'split inspector-hidden'}>
        <section class="stage" aria-label="Conversation">
          <div class="stage-head">
            <span class="stage-label">${this.rendererLabel()}</span>
            <button class="ghost small" @click=${() => this.reset()}>Start over</button>
          </div>
          <div class="transcript">${repeat(this.turns, t => t.id, t => this.renderTurn(t))}</div>
          <form
            class="composer"
            @submit=${(e: Event) => {
              e.preventDefault();
              void this.send(this.draft);
            }}
          >
            <div class="chips">
              ${SCENARIOS.map(s => html`<button type="button" class="chip" ?disabled=${this.busy} @click=${() => this.send(s.prompt)}>${s.prompt}</button>`)}
            </div>
            <div class="composer-row">
              <input
                type="text"
                placeholder="Ask the agent…"
                .value=${this.draft}
                ?disabled=${this.busy}
                @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
                aria-label="Message"
              />
              <button type="submit" class="send" ?disabled=${this.busy || !this.draft.trim()}>Send</button>
            </div>
          </form>
        </section>

        ${this.inspectorOpen ? this.renderInspector() : nothing}
      </main>
    `;
  }

  private rendererLabel() {
    switch (this.renderer) {
      case 'westpac':
        return 'Rendering with Material 3 components wearing GEL tokens';
      case 'baseline':
        return 'Rendering with Material 3 baseline tokens';
      default:
        return 'Rendering with the A2UI reference basic catalog';
    }
  }

  private renderTurn(t: Turn) {
    if (t.role === 'user') {
      return html`<div class="turn user"><div class="bubble">${t.text}</div></div>`;
    }
    return html`<div class="turn agent">
      ${t.thinking.length
        ? html`<ul class="thinking">
            ${t.thinking.map(l => html`<li>${l}</li>`)}
          </ul>`
        : nothing}
      ${t.text ? html`<p class="say">${t.text}</p>` : nothing}
      ${t.surfaceIds.map(id => {
        const surface = this.surfaces.get(id);
        return surface
          ? html`<div class="surface-host" data-surface=${id}><a2ui-surface .surface=${surface}></a2ui-surface></div>`
          : html`<div class="surface-host gone" data-surface=${id}><span>surface ${id} was deleted</span></div>`;
      })}
    </div>`;
  }

  private renderInspector() {
    const tabs: Array<[Tab, string]> = [
      ['premise', 'Premise'],
      ['stream', `Stream ${this.stream.length ? `· ${this.stream.length}` : ''}`],
      ['data', 'Data'],
      ['send', 'Send'],
    ];
    return html`<aside class="inspector" aria-label="Inspector">
      <nav class="tabs" role="tablist">
        ${tabs.map(([v, l]) => html`<button role="tab" aria-selected=${this.tab === v} class=${this.tab === v ? 'on' : ''} @click=${() => (this.tab = v)}>${l}</button>`)}
      </nav>
      <div class="panel">
        ${this.tab === 'premise' ? premise : nothing} ${this.tab === 'stream' ? this.renderStream() : nothing}
        ${this.tab === 'data' ? this.renderData() : nothing} ${this.tab === 'send' ? this.renderSend() : nothing}
      </div>
    </aside>`;
  }

  private renderStream() {
    return html`
      <div class="toolbar">
        <label class="check"><input type="checkbox" .checked=${this.manual} @change=${(e: Event) => {
          this.manual = (e.target as HTMLInputElement).checked;
          if (!this.manual) this.flush();
        }} /> Manual step</label>
        <button class="ghost small" ?disabled=${!this.pending} @click=${() => this.step()}>Next ${this.pending ? `(${this.pending})` : ''}</button>
        <label class="speed">Speed
          <select .value=${String(this.speed)} @change=${(e: Event) => (this.speed = Number((e.target as HTMLSelectElement).value))}>
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
        </label>
      </div>
      <p class="hint">Agent → renderer envelopes, and the actions the surfaces send back. Identical whichever renderer is on.</p>
      <ol class="stream">
        ${repeat(
          this.stream,
          e => e.id,
          e => html`<li class="entry ${e.dir}">
            <details>
              <summary>
                <span class="dir">${e.dir === 'in' ? '→' : e.dir === 'out' ? '←' : e.dir === 'you' ? '↳' : '!'}</span>
                <span class="label">${e.label}</span>
                ${e.surfaceId ? html`<span class="sid">${e.surfaceId}</span>` : nothing}
                <time>${e.at.toLocaleTimeString([], {hour12: false})}</time>
              </summary>
              <pre>${typeof e.body === 'string' ? e.body : JSON.stringify(e.body, null, 2)}</pre>
            </details>
          </li>`,
        )}
      </ol>
    `;
  }

  private renderData() {
    const ids = Array.from(this.surfaces.keys());
    if (!ids.length) return html`<p class="hint">No live surfaces.</p>`;
    return html`<p class="hint">Each surface’s data model, live. Edit and apply: the bindings update, the agent is not told.</p>
      ${ids.map(
        id => html`<section class="data-block">
          <header><code>${id}</code><button class="ghost small" @click=${() => this.applyData(id)}>Apply</button></header>
          <textarea
            spellcheck="false"
            .value=${this.dataText.get(id) ?? '{}'}
            @input=${(e: Event) => (this.dataText = new Map(this.dataText).set(id, (e.target as HTMLTextAreaElement).value))}
          ></textarea>
        </section>`,
      )}`;
  }

  private renderSend() {
    const example = JSON.stringify({
      version: 'v0.9',
      createSurface: {surfaceId: 'mine', catalogId: 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json'},
    });
    const example2 = JSON.stringify({
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'mine',
        components: [
          {id: 'root', component: 'Card', child: 'col'},
          {id: 'col', component: 'Column', children: ['h', 'b']},
          {id: 'h', component: 'Text', text: 'Hello from you', variant: 'h3'},
          {id: 'b', component: 'Text', text: 'Any *basic catalog* JSON renders here.'},
        ],
      },
    });
    return html`<p class="hint">One A2UI envelope per line (JSONL). Your messages are logged as ↳ in the stream.</p>
      <textarea class="raw" spellcheck="false" placeholder=${`${example}\n${example2}`} .value=${this.sendDraft} @input=${(e: Event) => (this.sendDraft = (e.target as HTMLTextAreaElement).value)}></textarea>
      ${this.sendError ? html`<p class="error">${this.sendError}</p>` : nothing}
      <div class="toolbar">
        <button class="ghost small" @click=${() => (this.sendDraft = `${example}\n${example2}`)}>Use example</button>
        <button class="send" ?disabled=${!this.sendDraft.trim()} @click=${() => this.sendRaw()}>Send to renderer</button>
      </div>`;
  }
}
