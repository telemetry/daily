import {html, nothing, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {ButtonApi} from '@a2ui/web_core/v0_9/basic_catalog';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import {A2wElement} from './base.js';

/**
 * A2UI's three button hints map cleanly onto Material's emphasis ladder:
 * primary → filled, default → outlined, borderless → text.
 */
@customElement('a2w-button')
export class A2wButton extends A2wElement<typeof ButtonApi> {
  protected override readonly api = ButtonApi;

  static override styles = css`
    :host {
      display: inline-flex;
      max-width: 100%;
    }
    :host > * {
      max-width: 100%;
    }
    /* Text rendered inside a button is a label, not a paragraph. */
    a2w-text {
      display: contents;
    }
    a2w-text .a2w-text {
      font: inherit;
      color: inherit;
      letter-spacing: inherit;
    }
    a2w-text .a2w-text p {
      display: inline;
      margin: 0;
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const disabled = props.isValid === false;
    const fire = () => {
      if (!disabled) props.action?.();
    };
    const child = props.child ? this.renderNode(props.child) : nothing;
    const label = props.accessibility?.label ?? nothing;
    switch (props.variant ?? 'default') {
      case 'primary':
        return html`<md-filled-button ?disabled=${disabled} aria-label=${label} @click=${fire}>${child}</md-filled-button>`;
      case 'borderless':
        return html`<md-text-button ?disabled=${disabled} aria-label=${label} @click=${fire}>${child}</md-text-button>`;
      default:
        return html`<md-outlined-button ?disabled=${disabled} aria-label=${label} @click=${fire}>${child}</md-outlined-button>`;
    }
  }
}
