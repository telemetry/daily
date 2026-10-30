/** One A2UI v0.9 envelope. Kept loose on purpose: the renderer validates. */
export type A2uiMessage = {version: 'v0.9'} & Record<string, unknown>;

export interface ActionLike {
  name: string;
  surfaceId: string;
  sourceComponentId: string;
  context: Record<string, unknown>;
}

/** What the mock agent hands back for a user turn or an action. */
export interface AgentReply {
  /** Plain-language line shown in the transcript before the surface. */
  say?: string;
  /** "Reasoning" lines, revealed one by one. Theatre, but honest theatre. */
  thinking?: string[];
  messages: A2uiMessage[];
}

export interface Scenario {
  id: string;
  title: string;
  /** The suggested prompt shown as a chip. */
  prompt: string;
  match: RegExp;
}
