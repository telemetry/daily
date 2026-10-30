import {html, nothing, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {IconApi} from '@a2ui/web_core/v0_9/basic_catalog';
import '@material/web/icon/icon.js';
import {A2wElement} from './base.js';
import {symbolFor} from './icons.js';

@customElement('a2w-icon')
export class A2wIcon extends A2wElement<typeof IconApi> {
  protected override readonly api = IconApi;

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      color: var(--md-sys-color-on-surface-variant);
    }
    md-icon {
      --md-icon-size: 24px;
    }
    md-icon.filled {
      font-variation-settings: 'FILL' 1;
    }
    svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const name = props.name as string | {svgPath: string} | undefined;
    const label = props.accessibility?.label;
    if (name && typeof name === 'object' && 'svgPath' in name) {
      return html`<svg viewBox="0 0 24 24" role=${label ? 'img' : 'presentation'} aria-label=${label ?? nothing}>
        <path d=${name.svgPath}></path>
      </svg>`;
    }
    const sym = symbolFor(String(name ?? 'info'));
    return html`<md-icon class=${sym.fill ? 'filled' : ''} aria-label=${label ?? nothing} aria-hidden=${label ? nothing : 'true'}
      >${sym.name}</md-icon
    >`;
  }
}
