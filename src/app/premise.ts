import {html} from 'lit';

/** The thinking experiment, in prose. Rendered in the inspector's first tab. */
export const premise = html`
  <article class="premise">
    <p class="premise-kicker">A thinking experiment</p>
    <h2>The agent writes the intent.<br />The bank writes the interface.</h2>

    <p>
      <a href="https://a2ui.org" target="_blank" rel="noopener">A2UI</a> lets an agent describe a screen as a flat list
      of components with data bindings: no code, no pixels, no colours. The client owns a <em>catalog</em> of what may be
      drawn, and the agent can only ask for things in it.
    </p>
    <p>
      So what happens when the catalog is a bank’s design system? Here the standard basic catalog is implemented with
      <a href="https://github.com/material-components/material-web" target="_blank" rel="noopener">Material 3</a>
      components whose system tokens are pointed, one by one, at
      <a href="https://github.com/WestpacGEL/GEL-next" target="_blank" rel="noopener">Westpac GEL</a> tokens. The agent on
      the left has never heard of Westpac. It speaks only A2UI.
    </p>

    <h3>Three propositions</h3>
    <ol>
      <li>
        <strong>Brand lives in the renderer, not the prompt.</strong> Switch the renderer above mid-conversation. The
        stream in the next tab does not change by a byte.
      </li>
      <li>
        <strong>Constraint is the feature.</strong> Every screen the agent invents is already on-system, because it can
        only compose from parts that exist. There is no way to ask for an off-brand button.
      </li>
      <li>
        <strong>The surface is a view; the logic stays home.</strong> Drag the term-deposit slider: nothing is
        recalculated until “Update estimate” sends the data model back. That delay is the honest shape of the protocol.
      </li>
    </ol>

    <h3>Things to try</h3>
    <ul>
      <li>Run “Move money”, then watch the earlier accounts surface update by data path, not by re-render.</li>
      <li>Turn on manual stepping and watch progressive rendering: the root arrives before its children.</li>
      <li>Edit a surface’s data model in the Data tab. The agent is never told.</li>
      <li>Paste your own JSONL in Send. If it validates against the catalog, it renders in GEL.</li>
    </ul>

    <h3>Seams</h3>
    <ul>
      <li>GEL ships light mode only. The dark scheme here is derived from the same primitives, and is a proposal.</li>
      <li>The Westpac typeface is licensed and not included; headings fall back to the system stack.</li>
      <li>Icons are Material Symbols standing in for the GEL icon set.</li>
      <li>Hierarchy is the agent’s call. Who reviews a headline no designer wrote?</li>
    </ul>
    <p class="premise-foot">
      Everything shown is fictional. Product names are used to think with Westpac’s design language; balances, people and
      references are invented.
    </p>
  </article>
`;
