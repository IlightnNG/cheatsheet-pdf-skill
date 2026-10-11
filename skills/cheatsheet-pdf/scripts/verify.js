#!/usr/bin/env node
// verify.js - run every layout gate against a rendered sheet and report pass/fail.
//
//   node verify.js <out.pdf> [--work=<dir>] [--thin=0.25]
//
// The gates read the built sheet.html (next to the PDF's .cheatsheet/ folder by default) and
// measure real geometry in a browser - never text extraction, which reports lone punctuation
// and mis-ordered formulas even when the page is laid out correctly.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const LIB = path.join(HERE, 'lib');
const TOOLS = path.join(HERE, 'tools');

const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (const a of argv) {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  if (m) flags[m[1]] = m[2] === undefined ? true : m[2];
  else positional.push(a);
}
const pdf = positional[0];
if (!pdf) { console.error('verify: usage: node verify.js <out.pdf> [--work=<dir>]'); process.exit(2); }
if (!fs.existsSync(pdf)) { console.error('verify: PDF not found: ' + pdf); process.exit(2); }

const work = path.resolve(flags.work || path.join(path.dirname(path.resolve(pdf)), '.cheatsheet'));
const sheet = path.join(work, 'sheet.html');
if (!fs.existsSync(sheet)) {
  console.error('verify: ' + sheet + ' not found. Run cheatsheet.js first, or pass --work=<dir>.');
  process.exit(2);
}
const thin = flags.thin === undefined ? '0.25' : String(flags.thin);

// Refuse to verify a PDF against a sheet that is not its own. Rendering two variants from one
// directory (the landscape and portrait demos) leaves only the LAST build in .cheatsheet/, and
// measuring the other PDF against it passed every gate while describing the wrong page - the
// worst failure mode for a verifier. cheatsheet.js writes the stamp; an older build without one
// still verifies as before.
let stamp = null;
try {
  stamp = JSON.parse(fs.readFileSync(path.join(work, 'build.json'), 'utf8'));
  const pdfBase = path.basename(path.resolve(pdf));
  if (stamp.pdf && stamp.pdf !== pdfBase) {
    console.error('verify: ' + sheet + ' is the build for "' + stamp.pdf + '", not "' + pdfBase + '".\n' +
                  '  Re-render this PDF so its sheet is rebuilt, or pass --work=<dir>.');
    process.exit(2);
  }
} catch (e) { /* no stamp, or unreadable: fall through to the gates */ }

const env = Object.assign({}, process.env, { SHEET_DIR: work });
function tool(script, args) {
  try {
    return execFileSync(process.execPath, [path.join(TOOLS, script)].concat(args || []), {
      encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000
    });
  } catch (e) {
    return (e.stdout || '') + '\n' + (e.stderr || '');
  }
}

const results = [];
const record = (name, ok, detail) => { results.push({ name, ok, detail }); };

// ---- 1. no formula wrapped mid-formula
const wrap = tool('wrapcheck.js');
record('no formula wrapped', /no formula wrapped/.test(wrap),
       (wrap.match(/WRAP\d+[^\n]*/g) || []).length + ' wrapped');

// ---- 2. no punctuation stranded on its own line
const orph = tool('orphans.js');
const orphN = (/orphaned:\s*(\d+)/.exec(orph) || [, '?'])[1];
record('no orphaned punctuation', orphN === '0', 'orphaned=' + orphN);

// ---- 3. math size hierarchy: supporting math must not be smaller than INLINE math in prose
// (the 0.85em reference - not the body text size, which boxed math may legitimately sit below).
// A sheet need not use all three formula box types, so an unused context is "not applicable",
// not a failure: sizes.js reports n/a for a context that is absent.
const sizes = tool('sizes.js');
const ratio = (k) => { const m = new RegExp(k + ' / inline = ([\\d.]+)x').exec(sizes); return m ? parseFloat(m[1]) : null; };
const proseSize = (/inline\s+\$?\s*: math=([\d.]+)pt/.exec(sizes) || [, '?'])[1];
const fxs = ratio('fxs'), fxc = ratio('fxc');
const hierarchyOk = (fxs === null || fxs >= 1) && (fxc === null || fxs === null || fxc > fxs);
record('math size hierarchy', hierarchyOk,
       'fxs/inline=' + (fxs === null ? 'n/a' : fxs) + '  fxc/inline=' + (fxc === null ? 'n/a' : fxc) +
       '  inline math=' + proseSize + 'pt' + (fxs === null ? '  (no supporting box on this sheet)' : ''));

// ---- 4. the multicol container was not widened past the page
const diag = tool('diag.js', [path.join(work, 'preview.png')]);
const num = (k) => { const m = new RegExp(k + '=([\\d.]+)').exec(diag); return m ? parseFloat(m[1]) : NaN; };
const inner = num('pageInner'), client = num('flowClient'), scroll = num('flowScroll');
record('container not widened (fits declared columns)',
       Math.abs(inner - client) < 2 && Math.abs(client - scroll) < 2,
       'pageInner=' + inner + ' flowClient=' + client + ' flowScroll=' + scroll);
const fill = num('fillPct');
// The number is the TALLEST column, not the last one: it answers "did content run past the page
// height". Calling it "fill" invited reading it as page fullness, which it is not - a sheet using
// 3.58 of 4 columns prints 100% here while measure.js reports the last column at 58%.
// On a multi-page sheet the tallest column is not enough: a page is a fixed box and Chrome CLIPS
// what does not fit (measured: 420mm of content in a 204mm box still printed one page), so the
// per-page budget that paginate-pages.js measured while splitting is checked here too - that
// measurement already exists, so no second browser pass is needed.
let pagesOk = true, pagesDetail = '';
try {
  const pg = JSON.parse(fs.readFileSync(path.join(work, 'pages.json'), 'utf8'));
  const over = (pg.cuts || []).filter((c) => c.used > c.cols + 0.02);
  const filled = pg.filled === undefined ? (pg.cuts || []).length : pg.filled;
  pagesOk = over.length === 0;
  pagesDetail = over.length
    ? '  OVER BUDGET: ' + over.map((c) => 'page ' + c.page + ' uses ' + c.used.toFixed(2) + '/' + c.cols).join(', ')
    : '  ' + filled + ' of ' + pg.pages + ' page(s) with content';
} catch (e) { /* no pagination pass: single-page build */ }
record('last column not overflowing', !isNaN(fill) && fill <= 100.5 && pagesOk,
       'tallest column=' + fill + '%' + pagesDetail);

// ---- 5. hairline thickness inside the PDF
const rules = tool('rules.js', [path.resolve(pdf)]);
const heights = [...rules.matchAll(/^\s+([\d.]+)\s+(\d+)\s+([\d.]+)\s*$/gm)].map((m) => parseFloat(m[1]));
if (Number(thin) > 0 && heights.length) {
  const worst = Math.max(...heights);
  record('hairlines thinned to ' + thin + 'pt', Math.abs(worst - Number(thin)) < 0.02,
         heights.length + ' rules, max=' + worst.toFixed(3) + 'pt');
} else {
  record('hairline check skipped', true, Number(thin) > 0 ? 'no thin rules found' : '--thin=0');
}

// ---- 6. the PDF itself: one page, A4 landscape, embedded math fonts
const bytes = fs.readFileSync(path.resolve(pdf));
const s = bytes.toString('latin1');
const pages = (/\/Count\s+(\d+)/.exec(s) || [, '?'])[1];
const box = (/\/MediaBox\s*\[([^\]]*)\]/.exec(s) || [, ''])[1].trim().split(/\s+/).map(Number);
const wpt = Math.round(box[2] || 0), hpt = Math.round(box[3] || 0);
const fonts = (s.match(/\+KaTeX/g) || []).length;
// Either A4 orientation passes: @page in sheet.css is editable, and a portrait variant is a
// documented customisation. Requiring landscape here would fail a perfectly good sheet.
const isA4 = (wpt === 842 && hpt === 595) || (wpt === 595 && hpt === 842);
const wantPages = stamp && stamp.pages ? stamp.pages : 1;
record('exactly ' + wantPages + ' page' + (wantPages === 1 ? '' : 's'), pages === String(wantPages),
       'pages=' + pages);
record('A4 page', isA4, wpt + 'x' + hpt + 'pt (' + (wpt > hpt ? 'landscape' : 'portrait') + ')');
record('math fonts embedded', fonts > 0, fonts + ' KaTeX subsets');

// ---- report
const pad = Math.max(...results.map((r) => r.name.length));
console.log('\nverify: ' + path.basename(pdf) + '   (work dir ' + work + ')\n');
for (const r of results) {
  console.log('  ' + (r.ok ? 'PASS' : 'FAIL') + '  ' + r.name.padEnd(pad) + '   ' + r.detail);
}
const failed = results.filter((r) => !r.ok);
console.log('\n  ' + (results.length - failed.length) + '/' + results.length + ' gates passed');
if (failed.length) {
  console.log('\n  Remaining failures usually mean: trim Markdown (capacity), shorten an over-wide');
  console.log('  formula, or re-run cheatsheet.js after a stylesheet change.');
  process.exit(1);
}
