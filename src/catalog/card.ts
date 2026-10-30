import {html, nothing, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {CardApi, DividerApi} from '@a2ui/web_core/v0_9/basic_catalog';
import '@material/web/labs/card/outlined-card.js';
import '@material/web/divider/divider.js';
import {A2wElement} from './base.js';

/**
 * GEL panels are bordered rather than floated, so the outlined card is the
 * honest Material counterpart. Padding follows the GEL 8px grid.
 */
@customElement('a2w-card')
export class A2wCard extends A2wElement<typeof CardApi> {
  protected override readonly api = CardApi;

  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    md-outlined-card {
      display: block;
      padding: calc(var(--gel-space) * 3);
      background: var(--md-sys-color-surface-container-lowest);
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    return html`<md-outlined-card>${this.renderNode(props.child)}</md-outlined-card>`;
  }
}

@customElement('a2w-divider')
export class A2wDivider extends A2wElement<typeof DividerApi> {
  protected override readonly api = DividerApi;

  static override styles = css`
    :host {
      display: block;
    }
    :host([axis='vertical']) {
      align-self: stretch;
      width: 1px;
      background: var(--md-sys-color-outline-variant);
      margin: 0 calc(var(--gel-space) / 2);
    }
    md-divider {
      --md-divider-color: var(--md-sys-color-outline-variant);
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const axis = props.axis ?? 'horizontal';
    this.setAttribute('axis', axis);
    return axis === 'vertical' ? nothing : html`<md-divider></md-divider>`;
  }
}
