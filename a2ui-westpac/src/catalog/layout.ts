import {html, nothing, css, type PropertyValues} from 'lit';
import {customElement} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {ColumnApi, RowApi, ListApi} from '@a2ui/web_core/v0_9/basic_catalog';
import {A2wElement, ALIGN, JUSTIFY, childKey, type ChildRef} from './base.js';

/** Row and Column share one flex implementation; direction is the only difference. */
abstract class A2wFlex<Api extends typeof RowApi | typeof ColumnApi> extends A2wElement<Api> {
  override updated(changed: PropertyValues) {
    super.updated(changed);
    const props = this.controller?.props as {justify?: string; align?: string} | undefined;
    if (!props) return;
    this.style.justifyContent = props.justify ? (JUSTIFY[props.justify] ?? 'flex-start') : '';
    this.style.alignItems = props.align ? (ALIGN[props.align] ?? 'stretch') : '';
  }

  override render() {
    const props = this.controller?.props as {children?: ChildRef[]} | undefined;
    if (!props) return nothing;
    const children = Array.isArray(props.children) ? props.children : [];
    return html`${repeat(children, childKey, c => this.renderNode(c))}`;
  }
}

@customElement('a2w-row')
export class A2wRow extends A2wFlex<typeof RowApi> {
  protected override readonly api = RowApi;
  static override styles = css`
    :host {
      display: flex;
      flex-direction: row;
      gap: var(--a2w-gap);
      min-width: 0;
      max-width: 100%;
    }
  `;
}

@customElement('a2w-column')
export class A2wColumn extends A2wFlex<typeof ColumnApi> {
  protected override readonly api = ColumnApi;
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--a2w-gap);
      width: 100%;
      min-width: 0;
    }
  `;
}

@customElement('a2w-list')
export class A2wList extends A2wElement<typeof ListApi> {
  protected override readonly api = ListApi;

  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    .a2w-list {
      display: flex;
      flex-direction: column;
      gap: calc(var(--a2w-gap) / 2);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .a2w-list.horizontal {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--a2w-gap);
    }
    .a2w-list > li {
      display: block;
      min-width: 0;
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const children = (Array.isArray(props.children) ? props.children : []) as ChildRef[];
    const align = props.align ? (ALIGN[props.align] ?? 'stretch') : 'stretch';
    return html`<ul class="a2w-list ${props.direction ?? 'vertical'}" style="align-items:${align}">
      ${repeat(children, childKey, c => html`<li>${this.renderNode(c)}</li>`)}
    </ul>`;
  }
}
