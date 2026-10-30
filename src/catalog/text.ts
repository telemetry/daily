import {html, nothing, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {TextApi} from '@a2ui/web_core/v0_9/basic_catalog';
import {markdown} from '@a2ui/web_core/v0_9/basic_catalog';
import {A2wElement} from './base.js';

/** A2UI text variant → Material type scale role. */
const SCALE: Record<string, string> = {
  h1: 'md-typescale-display-small',
  h2: 'md-typescale-headline-large',
  h3: 'md-typescale-headline-medium',
  h4: 'md-typescale-title-large',
  h5: 'md-typescale-title-medium',
  caption: 'md-typescale-label-medium',
  body: 'md-typescale-body-large',
};

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5']);

@customElement('a2w-text')
export class A2wText extends A2wElement<typeof TextApi> {
  protected override readonly api = TextApi;

  static override styles = css`
    /* No min-width: 0 here. A flex row may shrink prose to its longest word,
       but never split a figure like $2,419.55 across lines. */
    :host {
      display: block;
    }
    .a2w-text {
      color: var(--md-sys-color-on-surface);
      overflow-wrap: break-word;
    }
    .a2w-heading,
    .a2w-caption {
      font-variant-numeric: tabular-nums;
    }
    .a2w-text :is(p, ul, ol, blockquote, pre) {
      margin: 0;
    }
    .a2w-text :is(p, ul, ol) + :is(p, ul, ol) {
      margin-top: 0.5em;
    }
    .a2w-text:is(h1, h2, h3, h4, h5, h6) {
      margin: 0;
    }
    .a2w-text :is(h1, h2, h3, h4, h5, h6) {
      margin: 0;
      font: inherit;
    }
    .a2w-text a {
      color: var(--md-sys-color-primary);
      text-decoration-thickness: 1px;
      text-underline-offset: 0.15em;
    }
    .a2w-text code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.875em;
      background: var(--md-sys-color-surface-container);
      padding: 0.05em 0.3em;
      border-radius: var(--md-sys-shape-corner-extra-small);
    }
    .a2w-heading {
      color: var(--a2w-heading-color);
      font-family: var(--a2w-heading-font);
      letter-spacing: -0.01em;
    }
    .a2w-caption {
      color: var(--md-sys-color-on-surface-variant);
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const variant = props.variant ?? 'body';
    const text = typeof props.text === 'string' ? props.text : String(props.text ?? '');
    const scale = SCALE[variant] ?? SCALE.body;
    const classes = ['a2w-text', scale, `a2w-text-${variant}`];

    if (HEADINGS.has(variant)) {
      classes.push('a2w-heading');
      const tag = variant;
      // Headings are plain text by spec: markdown is only for body copy.
      switch (tag) {
        case 'h1':
          return html`<h1 class=${classes.join(' ')}>${text}</h1>`;
        case 'h2':
          return html`<h2 class=${classes.join(' ')}>${text}</h2>`;
        case 'h3':
          return html`<h3 class=${classes.join(' ')}>${text}</h3>`;
        case 'h4':
          return html`<h4 class=${classes.join(' ')}>${text}</h4>`;
        default:
          return html`<h5 class=${classes.join(' ')}>${text}</h5>`;
      }
    }
    if (variant === 'caption') {
      classes.push('a2w-caption');
      return html`<span class=${classes.join(' ')}>${text}</span>`;
    }
    return html`<div class=${classes.join(' ')}>${markdown(text)}</div>`;
  }
}
