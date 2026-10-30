import {html, nothing, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {styleMap} from 'lit/directives/style-map.js';
import {ImageApi} from '@a2ui/web_core/v0_9/basic_catalog';
import {A2wElement} from './base.js';

const FIT: Record<string, string> = {
  contain: 'contain',
  cover: 'cover',
  fill: 'fill',
  none: 'none',
  scaleDown: 'scale-down',
};

function safeUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  try {
    const u = new URL(url, location.href);
    return ['http:', 'https:', 'data:', 'blob:'].includes(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}

@customElement('a2w-image')
export class A2wImage extends A2wElement<typeof ImageApi> {
  protected override readonly api = ImageApi;

  static override styles = css`
    :host {
      display: block;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      border-radius: var(--md-sys-shape-corner-medium);
      background: var(--md-sys-color-surface-container);
    }
    img.icon {
      width: 24px;
      height: 24px;
      border-radius: var(--md-sys-shape-corner-extra-small);
    }
    img.avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    img.smallFeature {
      max-width: 120px;
    }
    img.largeFeature {
      width: 100%;
      max-height: 400px;
    }
    img.header {
      width: 100%;
      height: 200px;
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const fit = FIT[props.fit ?? 'cover'] ?? 'cover';
    return html`<img
      class=${props.variant ?? 'mediumFeature'}
      src=${safeUrl(props.url) ?? nothing}
      alt=${props.description ?? ''}
      style=${styleMap({objectFit: fit})}
      loading="lazy"
    />`;
  }
}
