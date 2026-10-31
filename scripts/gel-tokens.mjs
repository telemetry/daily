// Generates app/src/main/kotlin/com/telemetry/a2uiwestpac/theme/GelWbc.kt from the
// published Westpac GEL design tokens (@westpac/style-config, built from
// github.com/WestpacGEL/GEL-next).
//
//   npm i --no-save @westpac/style-config && node scripts/gel-tokens.mjs
//
// or point GEL_TOKENS at a checked-out all-brands.json. The W3C token tree is
// walked and emitted as Compose `Color`/`Dp` values; semantic tokens reference
// primitives by name so the lineage survives into the Kotlin.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
let jsonPath = process.env.GEL_TOKENS;
let version = 'local';
if (!jsonPath) {
  const require = createRequire(import.meta.url);
  const entry = require.resolve('@westpac/style-config/tokens');
  const root = resolve(dirname(entry), '../..');
  jsonPath = resolve(root, 'dist/tokens/w3c/all-brands.json');
  version = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
}
const tokens = JSON.parse(readFileSync(jsonPath, 'utf8'));

const camel = s =>
  String(s)
    .replace(/[-_.\s]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[A-Z]/, c => c.toLowerCase());

const hexToColor = hex => {
  const h = hex.replace('#', '');
  const rgb = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6);
  const alpha = h.length === 8 ? h.slice(6, 8) : 'ff';
  return `Color(0x${alpha}${rgb}.toInt())`;
};

/** `{Primitives.color.WBC.muted.100}` → `Primitive.wbcMuted100` */
function refToName(value) {
  const m = /^\{(.+)\}$/.exec(String(value).trim());
  if (!m) return null;
  const [, kind, ...rest] = m[1].split('.');
  if (kind === 'color') return `Primitive.${camel([rest[0].toLowerCase(), ...rest.slice(1)].join('-'))}`;
  if (kind === 'border' && rest[0] === 'radius') return `Primitive.radius${rest[1].replace('px', '')}`;
  return null;
}

const prim = [];
for (const [family, ramp] of Object.entries(tokens.Primitives.color)) {
  if (!['WBC', 'reserved', 'mono'].includes(family)) continue;
  for (const [hue, steps] of Object.entries(ramp)) {
    if (steps && typeof steps === 'object' && '$value' in steps) {
      prim.push(`        val ${camel(`${family.toLowerCase()}-${hue}`)} = ${hexToColor(steps.$value)}`);
      continue;
    }
    for (const [step, tok] of Object.entries(steps)) {
      prim.push(`        val ${camel(`${family.toLowerCase()}-${hue}-${step}`)} = ${hexToColor(tok.$value)}`);
    }
  }
}
for (const [key, tok] of Object.entries(tokens.Primitives.border.radius)) {
  prim.push(`        val radius${key.replace('px', '')} = ${tok.$value}.dp`);
}

const brand = tokens.Tokens.Westpac['light-mode'];
const sem = [];
for (const [group, entries] of Object.entries(brand.color)) {
  sem.push(`    // ${group}`);
  for (const [name, tok] of Object.entries(entries)) {
    const varName = camel(name.includes(group) ? name : `${group}-${name}`);
    const ref = refToName(tok.$value);
    const desc = tok.$description ? ` // ${tok.$description.replace(/\s+/g, ' ')}` : '';
    sem.push(`    val ${varName} = ${ref ?? hexToColor(tok.$value)}${desc}`);
  }
}
sem.push('    // radius');
for (const [name, tok] of Object.entries(brand.border.radius)) {
  sem.push(`    val ${camel(`radius-${name.replace(/^rounded-/, '')}`)} = ${refToName(tok.$value) ?? `${tok.$value}.dp`}`);
}

const kt = `// GENERATED FILE — do not edit.
// Source: @westpac/style-config@${version} (Westpac GEL-next, github.com/WestpacGEL/GEL-next)
// Built by scripts/gel-tokens.mjs on ${new Date().toISOString().slice(0, 10)}.
package com.telemetry.a2uiwestpac.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Westpac (WBC) design tokens, light mode, as published by GEL. */
@Suppress("unused")
object GelWbc {
    object Primitive {
${prim.join('\n')}
    }

${sem.join('\n')}
}
`;
const out = resolve(here, '../app/src/main/kotlin/com/telemetry/a2uiwestpac/theme/GelWbc.kt');
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, kt);
console.log(`wrote ${out}`);
