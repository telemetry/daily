import {html, nothing, type PropertyValues} from 'lit';
import {A2uiLitElement} from '@a2ui/lit/v0_9';
import type {ComponentApi, InferredComponentApiSchemaType} from '@a2ui/web_core/v0_9';
import type {ResolveA2uiProps} from '@a2ui/web_core/resolution';

/**
 * Shared base for the Westpac × Material 3 implementations of the A2UI basic
 * catalog. Every component renders into light DOM so the page-level theme
 * (GEL tokens mapped onto `--md-sys-*`) reaches the Material Web elements
 * without any per-component plumbing.
 */
export abstract class A2wElement<Api extends ComponentApi> extends A2uiLitElement<
  Api,
  ResolveA2uiProps<InferredComponentApiSchemaType<Api>>
> {
  override createRenderRoot() {
    return this;
  }

  override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const props = this.controller?.props as {weight?: number} | undefined;
    if (props && typeof props.weight === 'number') {
      this.style.flex = String(props.weight);
    } else {
      this.style.removeProperty('flex');
    }
  }

  /** Client-side `checks` results, rendered as Material supporting text. */
  protected renderErrors(props: {isValid?: boolean; validationErrors?: string[]}) {
    if (props.isValid !== false || !props.validationErrors?.length) return nothing;
    return html`<div class="a2w-errors md-typescale-body-small" role="alert">
      ${props.validationErrors.map(e => html`<div>${e}</div>`)}
    </div>`;
  }

  protected errorText(props: {isValid?: boolean; validationErrors?: string[]}): string {
    return props.isValid === false ? (props.validationErrors ?? []).join(' ') : '';
  }
}

export type ChildRef = string | {id: string; basePath: string};

export function childKey(child: ChildRef): string {
  return typeof child === 'object' && child !== null
    ? `${child.basePath ?? ''}/${child.id}`
    : String(child);
}

export const JUSTIFY: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  spaceBetween: 'space-between',
  spaceAround: 'space-around',
  spaceEvenly: 'space-evenly',
  stretch: 'stretch',
};

export const ALIGN: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};
