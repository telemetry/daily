import {html, nothing, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {TabsApi, ModalApi} from '@a2ui/web_core/v0_9/basic_catalog';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';
import type {MdTabs} from '@material/web/tabs/tabs.js';
import {A2wElement} from './base.js';

@customElement('a2w-tabs')
export class A2wTabs extends A2wElement<typeof TabsApi> {
  protected override readonly api = TabsApi;

  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    md-tabs {
      --md-primary-tab-container-color: transparent;
    }
    .a2w-tab-panel {
      padding-top: var(--a2w-gap);
    }
  `;

  @state() private active = 0;

  override willUpdate(changed: Map<PropertyKey, unknown>) {
    super.willUpdate(changed);
    const tabs = this.controller?.props?.tabs;
    if (tabs && this.active >= tabs.length) this.active = 0;
  }

  override render() {
    const props = this.controller?.props;
    if (!props?.tabs?.length) return nothing;
    const current = props.tabs[this.active];
    return html`
      <md-tabs
        .activeTabIndex=${this.active}
        @change=${(e: Event) => (this.active = (e.target as MdTabs).activeTabIndex)}
      >
        ${props.tabs.map(t => html`<md-primary-tab>${t.title}</md-primary-tab>`)}
      </md-tabs>
      <div class="a2w-tab-panel" role="tabpanel">${current ? this.renderNode(current.child) : nothing}</div>
    `;
  }
}

@customElement('a2w-modal')
export class A2wModal extends A2wElement<typeof ModalApi> {
  protected override readonly api = ModalApi;

  static override styles = css`
    :host {
      display: inline-block;
    }
    .a2w-modal-trigger {
      display: inline-block;
      cursor: pointer;
    }
    md-dialog {
      min-width: min(420px, 90vw);
      max-width: min(640px, 92vw);
    }
  `;

  @state() private open = false;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    return html`
      <span class="a2w-modal-trigger" @click=${() => (this.open = true)}>${this.renderNode(props.trigger)}</span>
      <md-dialog ?open=${this.open} @closed=${() => (this.open = false)}>
        <div slot="content">${this.open ? this.renderNode(props.content) : nothing}</div>
        <div slot="actions">
          <md-text-button @click=${() => (this.open = false)}>Close</md-text-button>
        </div>
      </md-dialog>
    `;
  }
}
