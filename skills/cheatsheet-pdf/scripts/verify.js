#!/usr/bin/env node
// verify.js - run every layout gate against a rendered sheet and report pass/fail.
//
//   node verify.js <out.pdf> [--work=<dir>] [--thin=0.25] [--theme=any]
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
if (!pdf) { console.error('verify: usage: node verify.js <out.pdf> [--work=<dir>] [--theme=any]'); process.exit(2); }
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

// ---- 1b. every display block was consumed by KaTeX
// A "$$!" left in the sheet means md2body never recognised the block (a stray character before the
// marker, or a marker not at column 0), and the paper would print the marker itself.
let sheetHtml = '';
try { sheetHtml = fs.readFileSync(sheet, 'utf8'); } catch (e) { /* gates below will notice */ }
// The stylesheet carries a comment that documents the markers ($$! / $$? ), so the check must read
// the body only: strip <style> blocks and HTML comments first.
const sheetBody = sheetHtml.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
const leftMarkers = (sheetBody.match(/\$\$[!?]/g) || []).length;
record('display markers consumed', leftMarkers === 0, leftMarkers + ' leftover "$$!"/"$$?"');
// ---- 1. no formula wrapped mid-formula
const wrap = tool('wrapcheck.js');record('no formula wrapped', /no formula wrapped/.test(wrap),
       (wrap.match(/WRAP\d+[^\n]*/g) || []).length + ' wrapped');

// ---- 1c. the visual identity matches the reference sheet
// Colours, box fills, dividers and the typeface are what make two sheets look different once the
// conventions are followed, so they are checked. A custom look is allowed, but must be declared:
//   node verify.js <out.pdf> --theme=any
const themeOut = (() => { try { return execFileSync(process.execPath, [path.join(LIB, 'theme.js')], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } })();
const themeDiff = (themeOut.match(/DIFF[^\n]*/g) || []).length;
const themeOk = /0 token\(s\) differ/.test(themeOut);
record('theme matches the reference', themeOk || flags.theme === 'any',
       themeOk ? 'all reference tokens match' :
       'custom theme (' + themeDiff + ' token(s) changed, --theme=any)');

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

// ---- 4. capacity: a single page must not widen its container; a multi-page sheet is judged by
// the per-page column budget that paginate-pages.js already measured.
// The old rule compared pageInner/flowClient/flowScroll on page 1 only, which failed on EVERY
// two-page sheet: the flow legitimately needs more width than one page once the content is ~1.9
// pages, even though both pages print correctly (observed: flowScroll=1321 on a clean 2-page A4
// with zero wrapped formulas and nothing clipped). Two different questions, two different gates.
const diag = tool('diag.js', [path.join(work, 'preview.png')]);
const num = (k) => { const m = new RegExp(k + '=([\\d.]+)').exec(diag); return m ? parseFloat(m[1]) : NaN; };
const inner = num('pageInner'), client = num('flowClient'), scroll = num('flowScroll');
const fill = num('fillPct');

let pg = null;
try { pg = JSON.parse(fs.readFileSync(path.join(work, 'pages.json'), 'utf8')); } catch (e) { /* single page */ }
const multi = !!(pg && (pg.pages || 0) > 1);

if (multi) {
  const over = (pg.cuts || []).filter((c) => c.used > c.cols + 0.02);
  const filled = pg.filled === undefined ? (pg.cuts || []).length : pg.filled;
  const fills = (pg.cuts || []).map((c) => Math.round(c.used / c.cols * 100) + '%');
  record('no page over its column budget',
         over.length === 0 && filled <= pg.pages,
         over.length
           ? 'OVER: ' + over.map((c) => 'p' + c.page + ' ' + c.used.toFixed(2) + '/' + c.cols).join(', ')
           : 'fill ' + fills.join(' / ') + ' of ' + pg.pages + ' page(s)');
  record('last column not overflowing', true,
         'page 1 tallest column=' + fill + '% (a multi-page sheet fills page 1 by design)');
} else {
  // What matters is that no block is wider than the column area: flowScroll > flowClient. The
  // pageInner - flowClient difference is padding and legitimately varies by a fraction of a
  // millimetre, so it must not fail the gate (a 2.3pt difference failed a perfectly clean sheet).
  record('container not widened (fits declared columns)', scroll <= client + 1.5,
         'pageInner=' + inner + ' flowClient=' + client + ' flowScroll=' + scroll);
  record('last column not overflowing', !isNaN(fill) && fill <= 100.5,
         'tallest column=' + fill + '%');
}

// ---- 4c. no page needs more columns than it declares
// The height model that split the pages can be one block optimistic, and Chrome then re-lays that
// block into an extra column which the page box clips - the printed page loses a whole column, and
// the only visible trace is a few word fragments at the page corner. Only a browser measurement
// catches it, so every page is checked.
const ow = tool('overwidth.js');
const owOk = /every page fits/i.test(ow);
record('no page wider than its columns', owOk,
       owOk ? 'all pages fit' : (ow.match(/OVERWIDTH[^\n]*/g) || [ow.trim().split('\n')[0]]).join('; '));

// ---- 5. hairline thickness inside the PDF// Chrome snaps every CSS rule to one device unit = 1.000pt in PDF space, so thinrules rewrites the
// rectangles it can identify down to 0.25pt. Some 1.000pt fills survive by design: a KaTeX
// \xrightarrow shaft is drawn as a wide, 1pt-tall rectangle and is visually correct at that
// thickness. The gate therefore asserts "nothing fatter than one snapped unit", and reports how
// much was actually thinned, instead of demanding that every rectangle be 0.25pt.
const rules = tool('rules.js', [path.resolve(pdf)]);
const ruleRows = [...rules.matchAll(/^\s+([\d.]+)\s+(\d+)\s+([\d.]+)\s*$/gm)]
  .map((m) => ({ h: parseFloat(m[1]), n: parseInt(m[2], 10) }));
if (Number(thin) > 0 && ruleRows.length) {
  const worst = Math.max(...ruleRows.map((r) => r.h));
  const total = ruleRows.reduce((a, r) => a + r.n, 0);
  const atThin = ruleRows.filter((r) => Math.abs(r.h - Number(thin)) < 0.02).reduce((a, r) => a + r.n, 0);
  // atThin > 0 matters: a run where thinrules silently found nothing leaves every rule at 1 pt, and
  // "worst <= 1.05" alone would pass it.
  record('hairlines thinned to ' + thin + 'pt', worst <= 1.05 && atThin > 0,
         total + ' rule fill(s): ' + atThin + ' at ' + thin + 'pt, worst ' + worst.toFixed(3) +
         'pt' + (worst > 1.05 ? '' : ' (1pt fills are arrow shafts / snapped rules)'));
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
