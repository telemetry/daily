/**
 * Tiny helpers for authoring basic-catalog components. They exist only to keep
 * the scenarios readable; the output is ordinary A2UI JSON.
 */
import type {A2uiMessage} from './types.js';

export const CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';

type Component = Record<string, unknown> & {id: string; component: string};

export const text = (id: string, text: unknown, variant?: string, extra: Record<string, unknown> = {}): Component => ({
  id,
  component: 'Text',
  text,
  ...(variant ? {variant} : {}),
  ...extra,
});

export const caption = (id: string, t: unknown) => text(id, t, 'caption');

export const icon = (id: string, name: string): Component => ({id, component: 'Icon', name});

export const column = (id: string, children: unknown, extra: Record<string, unknown> = {}): Component => ({
  id,
  component: 'Column',
  children,
  ...extra,
});

export const row = (id: string, children: unknown, extra: Record<string, unknown> = {}): Component => ({
  id,
  component: 'Row',
  children,
  ...extra,
});

export const card = (id: string, child: string): Component => ({id, component: 'Card', child});

export const divider = (id: string): Component => ({id, component: 'Divider'});

/** A labelled button is two components in A2UI: the label Text and the Button. */
export const button = (
  id: string,
  label: string,
  variant: 'primary' | 'default' | 'borderless',
  event: string,
  context: Record<string, unknown> = {},
  extra: Record<string, unknown> = {},
): Component[] => [
  text(`${id}_label`, label),
  {id, component: 'Button', child: `${id}_label`, variant, action: {event: {name: event, context}}, ...extra},
];

/** `formatCurrency` is a catalog function, so the agent never formats money itself. */
export const aud = (value: unknown) => ({
  call: 'formatCurrency',
  args: {value, currency: 'AUD'},
  returnType: 'string',
});

export const path = (p: string) => ({path: p});

/** `formatString` interpolates `${/data/path}` and `${fn(arg:value)}` on the client. */
export const fmt = (value: string) => ({call: 'formatString', args: {value}, returnType: 'string'});

/** A `checks` rule: a boolean function call plus the message shown when it fails. */
export const check = (call: string, args: Record<string, unknown>, message: string) => ({
  condition: {call, args, returnType: 'boolean'},
  message,
});

export const required = (p: string, message: string) => check('required', {value: path(p)}, message);

export const createSurface = (surfaceId: string): A2uiMessage => ({
  version: 'v0.9',
  createSurface: {surfaceId, catalogId: CATALOG_ID, sendDataModel: true},
});

export const update = (surfaceId: string, components: Component[]): A2uiMessage => ({
  version: 'v0.9',
  updateComponents: {surfaceId, components},
});

export const data = (surfaceId: string, value: unknown, p?: string): A2uiMessage => ({
  version: 'v0.9',
  updateDataModel: {surfaceId, ...(p ? {path: p} : {}), value},
});

export const deleteSurface = (surfaceId: string): A2uiMessage => ({version: 'v0.9', deleteSurface: {surfaceId}});
