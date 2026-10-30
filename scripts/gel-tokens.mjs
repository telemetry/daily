// Generates src/theme/gel-wbc.generated.css from the published Westpac GEL
// design tokens (@westpac/style-config, built from github.com/WestpacGEL/GEL-next).
//
// The W3C token tree is walked, references such as
// `{Primitives.color.WBC.primary.500}` are kept as CSS `var()` chains so the
// semantic → primitive lineage is visible in devtools, and everything is
// emitted under a `--gel-*` prefix on :root.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
// The package's exports map hides package.json, so resolve the tokens entry
// and walk up to the package root from there.
const tokensEntry = require.resolve('@westpac/style-config/tokens');
const pkgRoot = resolve(dirname(tokensEntry), '../..');
const pkg = JSON.parse(readFileSync(resolve(pkgRoot, 'package.json'), 'utf8'));
const tokens = JSON.parse(
  readFileSync(resolve(pkgRoot, 'dist/tokens/w3c/all-brands.json'), 'utf8'),
);

const BRAND = 'Westpac';
const MODE = 'light-mode';

const kebab = s =>
  String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_.]+/g, '-')
    .toLowerCase();

/** `{Primitives.color.WBC.muted.100}` → `var(--gel-primitive-wbc-muted-100)` */
function refToVar(value) {
  const m = /^\{(.+)\}$/.exec(String(value).trim());
  if (!m) return null;
  const parts = m[1].split('.');
  if (parts[0] !== 'Primitives') return null;
  const [, kind, ...rest] = parts; // kind: color | border
  if (kind === 'color') return `var(--gel-primitive-${rest.map(kebab).join('-')})`;
  if (kind === 'border' && rest[0] === 'radius') return `var(--gel-primitive-radius-${kebab(rest[1])})`;
  return null;
}

function dimension(v) {
  return /^-?\d+(\.\d+)?$/.test(String(v)) ? `${v}px` : String(v);
}

const lines = [];
const push = (name, value, desc) => {
  lines.push(`  ${name}: ${value};${desc ? ` /* ${desc.replace(/\*\//g, '* /')} */` : ''}`);
};

// ---- primitives -----------------------------------------------------------
lines.push('  /* Primitives: colour ramps */');
for (const [family, ramp] of Object.entries(tokens.Primitives.color)) {
  if (!['WBC', 'reserved', 'mono'].includes(family)) continue;
  for (const [hue, steps] of Object.entries(ramp)) {
    if (steps && typeof steps === 'object' && '$value' in steps) {
      push(`--gel-primitive-${kebab(family)}-${kebab(hue)}`, steps.$value);
      continue;
    }
    for (const [step, tok] of Object.entries(steps)) {
      push(`--gel-primitive-${kebab(family)}-${kebab(hue)}-${kebab(step)}`, tok.$value);
    }
  }
}
lines.push('');
lines.push('  /* Primitives: border radius */');
for (const [key, tok] of Object.entries(tokens.Primitives.border.radius)) {
  push(`--gel-primitive-radius-${kebab(key)}`, dimension(tok.$value));
}

// ---- semantic (Westpac, light mode) -----------------------------------------
const brand = tokens.Tokens[BRAND][MODE];
lines.push('');
lines.push(`  /* Semantic tokens: ${BRAND}, ${MODE} */`);
for (const [group, entries] of Object.entries(brand.color)) {
  lines.push(`  /* ${group} */`);
  for (const [name, tok] of Object.entries(entries)) {
    const varName = kebab(name).includes(kebab(group)) ? `--gel-${kebab(name)}` : `--gel-${kebab(group)}-${kebab(name)}`;
    push(varName, refToVar(tok.$value) ?? tok.$value, tok.$description);
  }
}
lines.push('  /* radius */');
for (const [name, tok] of Object.entries(brand.border.radius)) {
  push(`--gel-radius-${kebab(name.replace(/^rounded-/, ''))}`, refToVar(tok.$value) ?? dimension(tok.$value));
}

const css = `/* GENERATED FILE — do not edit.
 * Source: ${pkg.name}@${pkg.version} (Westpac GEL-next, github.com/WestpacGEL/GEL-next)
 * Built by scripts/gel-tokens.mjs on ${new Date().toISOString().slice(0, 10)}.
 */
:root {
${lines.join('\n')}
}
`;

const out = resolve(here, '../src/theme/gel-wbc.generated.css');
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, css);
console.log(`wrote ${out} (${lines.length} lines)`);
