// theme.js - the visual identity of the sheet, as a checkable token list.
//
//   node theme.js [--css=<file>] [--json]
//
// The documented conventions can be followed to the letter and still produce a different-looking
// page: a different red for the ★★★ bar, a different pink for the core formula box, a thinner rule
// under the header, a sans-serif body. Colour, box fills, dividers and the typeface ARE the look,
// so they are pinned here as named tokens and compared verbatim.
//
// Everything the author is meant to tune - column count, base size, margins, paper - is NOT a
// theme token: those are layout, and the flags own them.
'use strict';
const fs = require('fs');
const path = require('path');

// selector -> { property: expected value }. Values are compared after normalising whitespace and
// lower-casing, so "1.2pt solid #1A3A6B" matches "1.2pt solid #1a3a6b".
const REFERENCE = {
  '.page': { 'font-family': '"cambria", "georgia", "times new roman", serif' },
  '.hdr': { 'border-bottom': '1.2pt solid #1a3a6b' },
  'h2.p3': { background: '#b02020', color: '#fff' },
  'h2.p2': { background: '#0d6b3a', color: '#fff' },
  'h2.p1': { background: '#5a6a7a', color: '#fff' },
  'h2.p0': { background: '#e2e6ea', color: '#444' },
  '.fxc': { background: '#fdeaea', 'border-left': '1.7pt solid #b02020' },
  '.fxd': { background: '#eef3fb', 'border-left': '1.3pt solid #1a3a6b' },
  '.fxs': { background: '#f6f7f8', 'border-left': '0.8pt solid #c3c9cf' },
  '.q': { background: '#fffaf0', 'border-left': '0.9pt solid #c07000' },
  code: { background: '#eef1f5' },
  mark: { background: '#ffe9a4' },
};

const argv = process.argv.slice(2);
const cssArg = argv.find((a) => a.startsWith('--css='));
const asJson = argv.includes('--json');
const baseCss = path.resolve(__dirname, '..', 'sheet.css');

// The sheet.html inlines the whole stylesheet (sheet.css plus any --css overlay), so reading it is
// the only way to see what the printed page actually used. Fall back to sheet.css when there is no
// build yet.
function loadCss() {
  const work = process.env.SHEET_DIR;
  if (work) {
    const sheet = path.join(work, 'sheet.html');
    if (fs.existsSync(sheet)) {
      const html = fs.readFileSync(sheet, 'utf8');
      // Every <style> block, in order: KaTeX's own CSS comes first, the sheet's (and any --css
      // overlay) last, so later declarations win exactly as they do in the browser.
      const blocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
      if (blocks.length) return { css: blocks.join('\n'), from: sheet };
    }
  }
  const extra = cssArg ? fs.readFileSync(path.resolve(cssArg.split('=')[1]), 'utf8') : '';
  return { css: fs.readFileSync(baseCss, 'utf8') + '\n' + extra, from: baseCss };
}

const { css: rawCss, from } = loadCss();
// Comments must go first: a `{` or `}` inside one breaks the rule split (it silently cost the
// .hdr rule its border when this parser was first written).
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');

// Collect declarations per selector; later rules win, which is exactly the overlay semantics.
const decls = {};
const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = ruleRe.exec(css)) !== null) {
  const selectors = m[1].split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const sel of selectors) {
    decls[sel] = decls[sel] || {};
    for (const part of m[2].split(';')) {
      const idx = part.indexOf(':');
      if (idx < 0) continue;
      const prop = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim().toLowerCase().replace(/\s+/g, ' ');
      if (prop) decls[sel][prop] = val;
    }
  }
}

const norm = (v) => (v === undefined ? '(unset)' : v.replace(/\s+/g, ' ').trim());
const results = [];
for (const [sel, props] of Object.entries(REFERENCE)) {
  for (const [prop, want] of Object.entries(props)) {
    const got = decls[sel] ? decls[sel][prop] : undefined;
    results.push({ sel, prop, want, got: norm(got), ok: norm(got) === norm(want) });
  }
}
const bad = results.filter((r) => !r.ok);

if (asJson) {
  console.log(JSON.stringify({ from, ok: bad.length === 0, results }, null, 2));
  process.exit(bad.length ? 1 : 0);
}

console.log('theme: ' + bad.length + ' token(s) differ from the reference   (source: ' + from + ')');
for (const r of results) {
  if (!r.ok) console.log('  DIFF  ' + (r.sel + ' ' + r.prop).padEnd(28) + 'reference "' + r.want + '"   got "' + r.got + '"');
}
if (!bad.length) console.log('  all ' + results.length + ' colour/typeface tokens match - the page will look like the reference');
process.exit(bad.length ? 1 : 0);
