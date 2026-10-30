import {setMarkdownRenderer} from '@a2ui/web_core/v0_9/basic_catalog';
import {renderMarkdown} from '@a2ui/markdown-it';
import {styles as typescale} from '@material/web/typography/md-typescale-styles.js';

import './theme/gel-wbc.generated.css';
import './theme/m3-westpac.css';
import './app/app.css';
import './catalog/index.js';
import './app/shell.js';

// Body copy in A2UI Text components is Markdown; this is the only renderer.
setMarkdownRenderer(renderMarkdown);

// Material's type scale classes, adopted once at document level because every
// component here renders into light DOM.
if (typescale.styleSheet) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, typescale.styleSheet];
}
