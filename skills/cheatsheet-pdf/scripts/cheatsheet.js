#!/usr/bin/env node
// cheatsheet.js - the one command that turns a Markdown master into a one-page A4 cheat sheet.
//
//   node cheatsheet.js <master.md> [out.pdf] [options]
//
// Stage A (authoring the Markdown) is the agent's job - see SKILL.md next to this script.
// This is stage B: render that Markdown to a PDF and check the result.
//
// Options
//   --base=<pt>    base (prose) font size; --base=css keeps the stylesheet value   [auto]
//   --math=<em>    math size relative to prose             [stylesheet: ~0.93]
//   --cols=<n>     number of columns                       [stylesheet: 5]
//   --pages=<n>    pages to fill; 1 for a single sheet      [2]
//   --gap=<mm>     column gutter                           [stylesheet: 1.9]
//   --split        advanced formula line breaking (breaks at relations, paginates)
//   --css=<file>   append a stylesheet on top of sheet.css (portrait, fonts, colours)
//   --thin=<pt>    rewrite PDF hairlines to this thickness; 0 disables   [0.25]
//   --no-print     stop after measuring (layout dry run, no PDF)
//   --lint         static checks only (markup leaks, glyphs, numbering); no PDF
//   --strict-style turn the shape advice into hard errors (for a class or a team)
//   --theme=any    declare a custom theme (changes colours/boxes away from the reference)
//   --audit        print the chapter/section/question structure, then exit
//   --renumber     render from a renumbered copy (the master is never edited)
//   --preview[=N]  also write <out>.pN.png so a human can look at page N
//   --fill=<pct>   advise when a page is emptier than this (multi-page only)
//   --base=auto    pick the largest base size that still fits the requested pages  [default]
//   --quiet        only print warnings and the final summary
//   --help         print this text
//   --version      print the version
//
// Exit codes: 0 success, 1 build or gate failure, 2 usage error.
// Env: CHROME_PATH, SHEET_DIR (intermediates land in <outdir>/.cheatsheet unless set).
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const LIB = path.join(HERE, 'lib');
const TOOLS = path.join(HERE, 'tools');

// ---------------------------------------------------------------- arguments
const KNOWN = ['base', 'math', 'cols', 'pages', 'gap', 'split', 'css', 'thin', 'no-print', 'quiet', 'help', 'version',
  'lint', 'audit', 'renumber', 'preview', 'fill', 'no-style', 'strict-style', 'theme'];
const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (const a of argv) {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  if (!m) { positional.push(a); continue; }
  if (KNOWN.indexOf(m[1]) < 0) {
    console.error("cheatsheet: unknown option '--" + m[1] + "'. Run with --help for the list.");
    process.exit(2);
  }
  flags[m[1]] = m[2] === undefined ? true : m[2];
}

function helpText() {
  // print only the leading // comment block; stopping at the first non-comment line keeps the
  // code out of the output
  const lines = fs.readFileSync(__filename, 'utf8').split('\n').slice(1);
  const body = [];
  for (const l of lines) {
    if (!/^\/\//.test(l)) break;
    body.push(l.replace(/^\/\/ ?/, ''));
  }
  return body.join('\n').trim();
}

if (flags.version) {
  // Walk up looking for package.json: the skill may be installed standalone (marketplace
  // installs copy just the skill directory), in which case there is no repo root.
  let dir = HERE;
  let version = 'unknown';
  for (let i = 0; i < 5; i++) {
    const p = path.join(dir, 'package.json');
    if (fs.existsSync(p)) { try { version = JSON.parse(fs.readFileSync(p, 'utf8')).version || version; } catch (e) { /* keep unknown */ } break; }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  console.log(version);
  process.exit(0);
}

const md = positional[0];
const outPdf = positional[1];
if (!md || flags.help) {
  console.log(helpText());
  process.exit(md ? 0 : 2);
}
if (!fs.existsSync(md)) { console.error('cheatsheet: markdown master not found: ' + md); process.exit(2); }

const mdAbs = path.resolve(md);
const outAbs = path.resolve(outPdf || mdAbs.replace(/\.md$/i, '') + '.pdf');

// Intermediates go in a hidden folder next to the output, so a run never litters the
// document's own directory and .cheatsheet/ can simply be gitignored.
const work = process.env.SHEET_DIR ? path.resolve(process.env.SHEET_DIR) : path.join(path.dirname(outAbs), '.cheatsheet');
fs.mkdirSync(work, { recursive: true });

// --renumber renders from a normalised copy: inserting a section by hand used to leave gaps
// (4.6 after 4.4) or duplicates (two 5.2s), because the number is the author's job. The master
// stays untouched, so the author keeps editing without thinking about numbers.
let srcMd = mdAbs;
if (flags.renumber) {
  const norm = path.join(work, 'normalized.md');
  execFileSync(process.execPath, [path.join(LIB, 'renumber.js'), mdAbs, norm],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], timeout: 60000 });
  srcMd = norm;
}

const env = Object.assign({}, process.env, {
  SHEET_DIR: work,
  SHEET_NO_SPLIT: flags.split ? '' : '1',      // conservative breaking is the default
  SHEET_BASE_PT: flags.base === undefined ? '' : String(flags.base),
  SHEET_MATH_EM: flags.math === undefined ? '' : String(flags.math),
  SHEET_COLS: flags.cols === undefined ? '' : String(flags.cols),
  SHEET_PAGES: flags.pages === undefined ? '' : String(flags.pages),
  SHEET_CSS: flags.css === undefined ? '' : path.resolve(String(flags.css)),
  SHEET_GAP_MM: flags.gap === undefined ? '' : String(flags.gap)
});

const quiet = !!flags.quiet;
function step(script, label, extraArgs) {
  try {
    const out = execFileSync(process.execPath, [path.join(LIB, script)].concat(extraArgs || []), {
      encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000
    });
    const lines = out.trim().split('\n').filter(Boolean);
    // ADVICE is the capacity hint the next iteration depends on, so it survives --quiet.
    for (const l of lines) if (!quiet || /^ADVICE/.test(l)) console.log('  [' + label + '] ' + l);
    return out;
  } catch (e) {
    // Surface the child's own message; Node's raw error dump hides it behind a stack trace.
    console.error('\ncheatsheet: step "' + label + '" (' + script + ') failed.');
    const err = ((e.stderr || '') + (e.stdout || '')).trim();
    if (err) console.error(err.split('\n').map((l) => '    ' + l).join('\n'));
    process.exit(1);
  }
}

// ---------------------------------------------------------------- pipeline

// Lint first: a literal "**" or a box-drawing stroke must never reach the printer. The checks are
// cheap (text only) and every one of them exists because that defect shipped once.
function lint(extraArgs) {
  try {
    const out = execFileSync(process.execPath, [path.join(LIB, 'lint.js'), srcMd].concat(extraArgs || []), {
      encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000
    });
    const lines = out.trim().split('\n').filter(Boolean);
    for (const l of lines) if (!quiet || /^LINT (ERROR|\d)/.test(l)) console.log('  [lint] ' + l);
    return { ok: true, out };
  } catch (e) {
    const out = ((e.stdout || '') + (e.stderr || '')).trim();
    if (out) for (const l of out.split('\n')) console.log('  [lint] ' + l);
    return { ok: false, out };
  }
}

// The shape check runs next to the lint, but as ADVICE: the reference sheet is a recommended
// template, and a user who wants three chapters or no statements section is allowed to have one.
// --strict-style is the opt-in for the people who must match the specimen exactly.
function style(extraArgs) {
  try {
    const out = execFileSync(process.execPath, [path.join(LIB, 'style.js'), srcMd].concat(extraArgs || []), {
      encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000
    });
    const lines = out.trim().split('\n').filter(Boolean);
    for (const l of lines) if (!quiet || /^STYLE (ERROR|\d)/.test(l)) console.log('  [style] ' + l);
    return { ok: true, out };
  } catch (e) {
    const out = ((e.stdout || '') + (e.stderr || '')).trim();
    if (out) for (const l of out.split('\n')) console.log('  [style] ' + l);
    return { ok: false, out };
  }
}

// The visual identity is not advice: if the colours, box fills, dividers or typeface drift, the page
// stops looking like the reference even when every content rule is followed. Reported after the
// build, because the theme is what the printed HTML actually used.
function theme() {
  try {
    const out = execFileSync(process.execPath, [path.join(LIB, 'theme.js')], {
      encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000
    });
    for (const l of out.trim().split('\n')) console.log('  [theme] ' + l);
    return { ok: true, out };
  } catch (e) {
    const out = ((e.stdout || '') + (e.stderr || '')).trim();
    if (out) for (const l of out.split('\n')) console.log('  [theme] ' + l);
    return { ok: false, out };
  }
}

if (flags.audit) {
  console.log('cheatsheet: ' + path.basename(mdAbs) + '   audit');
  lint(['--structure']);
  style();
  process.exit(0);
}

// md2body first: lint inspects the built body (that is where a literal "**" or "==" would show),
// and build.js needs body.html anyway.
step('md2body.js', 'md2body', [srcMd]);

const lintRes = lint();
if (!lintRes.ok) {
  console.error('\ncheatsheet: lint found errors - fix the Markdown first (or run with --lint to see all).');
  process.exit(1);
}
// The shape contract is advice: a sheet that is paragraphs instead of modules still prints, it just
// stops looking like the specimen. --strict-style turns the advice into errors.
if (!flags['no-style']) {
  const styleRes = style(flags['strict-style'] ? ['--strict'] : []);
  if (!styleRes.ok && flags['strict-style']) {
    console.error('\ncheatsheet: --strict-style and the sheet does not have the reference shape.');
    process.exit(1);
  }
}
if (flags.lint) {
  console.log('\ncheatsheet: --lint, stopping before the render.');
  process.exit(0);
}

// ---------------------------------------------------------------- base=auto
// 5.5 pt used to produce three pages where 5.4 pt produced two: one unbreakable block decided the
// count, and the advice line ("add topics / tighten") did not mention the smallest possible fix.
// Binary search keeps the type as large as the page budget allows.
// A soft runner: the base search MUST survive a page count that does not fit (paginate-pages.js
// exits 1 with ADVICE in that case), while every other stage keeps failing loudly.
function runSoft(script, label, extraArgs) {
  try {
    const out = execFileSync(process.execPath, [path.join(LIB, script)].concat(extraArgs || []), {
      encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000
    });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).trim() };
  }
}

// Tools live in ../tools and are measured in the browser. overwidth.js is the one that catches a
// page whose re-laid blocks need one more column than declared: the height model cannot see it, and
// the page box CLIPS the extra column (on a printed sheet this was two word fragments, "plus" and
// "equ", at the top-right corner of page 1).
function runToolSoft(script) {
  try {
    const out = execFileSync(process.execPath, [path.join(TOOLS, script)], {
      encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000
    });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).trim() };
  }
}

function layoutWith(basePt) {
  env.SHEET_BASE_PT = basePt === null ? '' : String(basePt);
  const buildOut = step('build.js', 'build');
  step('paginate.js', 'paginate');
  step('fit-formulas.js', 'fit');
  const pagesOut = runSoft('paginate-pages.js', 'pages');
  if (!pagesOut.ok) {
    // keep the ADVICE lines: the search is about to change the base, but the author should see why
    for (const l of pagesOut.out.split('\n')) if (/^ADVICE/.test(l)) console.log('  [pages] ' + l);
  }
  const ow = runToolSoft('overwidth.js');
  let pg = null;
  try { pg = JSON.parse(fs.readFileSync(path.join(work, 'pages.json'), 'utf8')); } catch (e) { /* single page */ }
  return { pg, buildOut, ow };
}
function fits(r, asked) {
  if (!r) return false;
  if (r.ow && !r.ow.ok) return false;   // a page needs more columns than declared: its text is clipped
  if (!r.pg) return true;               // one page of content: no split, so nothing to overflow
  if (r.pg.overflow) return false;
  return (r.pg.cuts || []).every((c) => c.used <= c.cols + 0.02) && (r.pg.filled || 0) <= asked;
}

const askedPages = Number(flags.pages) || 2;
// Default is auto: two authors rendering the same Markdown must land on the same page, and the base
// size is the one dial that silently differs between machines and reruns. --base=<pt> pins it,
// --base=css keeps whatever sheet.css says.
const baseFlag = flags.base === undefined ? 'auto' : String(flags.base);
if (baseFlag === 'auto') {
  // Warm start: reuse the base the last render of this folder settled on, so an edit costs one
  // layout pass instead of nine. Then try one step larger (an edit may have removed content), and
  // only then scan downward.
  let last = null;
  try { last = Number(JSON.parse(fs.readFileSync(path.join(work, 'build.json'), 'utf8')).base) || null; } catch (e) { /* first run */ }
  const cands = [];
  if (last && last >= 5.0 && last <= 5.8) cands.push(Number(last.toFixed(2)), Number((last + 0.1).toFixed(2)));
  for (let b = 5.8; b >= 5.0 - 1e-9; b -= 0.1) cands.push(Number(b.toFixed(2)));
  const tried = new Set();
  let chosen = null;
  for (const b of cands) {
    if (tried.has(b) || b > 5.8 || b < 5.0) continue;
    tried.add(b);
    const r = layoutWith(b);
    if (r.buildOut && /WARNING - \d+ formula\(s\) failed/.test(r.buildOut)) break;
    if (fits(r, askedPages)) { chosen = b; break; }
  }
  if (chosen === null) {
    chosen = 5.0;
    console.log('  [base] auto: nothing fits ' + askedPages + ' page(s) down to 5.0pt - using 5.0pt and reporting');
  } else {
    console.log('  [base] auto: ' + chosen + 'pt is the largest size that fits ' + askedPages + ' page(s)');
  }
  env.SHEET_BASE_PT = String(chosen);
} else {
  console.log('  knobs      base=' + (baseFlag === 'css' ? 'css default' : baseFlag) + '  math=' + (flags.math || 'css default') +
              '  cols=' + (flags.cols || 'css default'));
  const r = layoutWith(baseFlag === 'css' ? null : Number(baseFlag));
  if (r.buildOut && /WARNING - \d+ formula\(s\) failed/.test(r.buildOut)) {
    console.error('\ncheatsheet: KaTeX could not typeset every formula - fix the Markdown first.');
    process.exit(1);
  }
}

// The visual identity is a contract, not advice: same colours, same box fills, same dividers, same
// typeface as the reference sheet. A user who wants a different look says so with --theme=any, which
// keeps the check honest without blocking customisation.
const themeRes = theme();
if (!themeRes.ok && !flags.theme) {
  console.error('\ncheatsheet: the theme differs from the reference (see the DIFF lines above).');
  console.error('  If this is intentional, pass --theme=any; otherwise restore the tokens in sheet.css');
  console.error('  (they are listed in lib/theme.js) or drop the --css overlay that changed them.');
  process.exit(1);
}

// measure.js writes the geometry numbers that --fill and the ADVICE lines are based on.
// Refuse to print a sheet that does not fit the requested pages, or whose page needs more columns
// than declared: the printer would happily emit three pages for --pages=2, and an over-wide page
// CLIPS a whole column of text (the failure that left "plus"/"equ" fragments at the page corner).
let pgFinal = null;
try { pgFinal = JSON.parse(fs.readFileSync(path.join(work, 'pages.json'), 'utf8')); } catch (e) { /* single page */ }
const owFinal = runToolSoft('overwidth.js');
if ((pgFinal && !fits({ pg: pgFinal, ow: owFinal }, askedPages)) || (!pgFinal && !owFinal.ok)) {
  console.error('\ncheatsheet: the content does not fit the requested ' + askedPages + ' page(s) at this size.');
  if (pgFinal) console.error('  page fill: ' + (pgFinal.cuts || []).map((c) => Math.round(c.used / c.cols * 100) + '%').join(' / '));
  if (!owFinal.ok) console.error('  ' + owFinal.out.split('\n')[0] + '  (a column of text would be clipped)');
  console.error('  Fix by cutting content (lowest star tier first) or try --base=auto / --pages=' + (askedPages + 1) + '.');
  process.exit(1);
}
step('measure.js', 'measure');

// --fill: a half-empty second page is not a layout failure, but it is wasted paper, and the tool
// used to call that "good fit". The paginator already recorded how much of each page is used.
// Multi-page sheets get a default target of 85%; a one-page sheet is left alone because asking for
// "more content" when the author wanted one page is noise.
let pg = null;
try { pg = JSON.parse(fs.readFileSync(path.join(work, 'pages.json'), 'utf8')); } catch (e) { /* single page */ }
const fillTarget = flags.fill !== undefined ? Number(flags.fill) : (askedPages > 1 ? 85 : 0);
if (pg && (pg.cuts || []).length && fillTarget > 0) {
  const target = fillTarget;
  const low = pg.cuts.filter((c) => c.used / c.cols * 100 < target);
  for (const c of low) {
    console.log('ADVICE: page ' + c.page + ' is only ' + Math.round(c.used / c.cols * 100) + '% full (target ' +
                target + '%) - add examined topics rather than inflating the type.');
  }
}

if (flags['no-print']) {
  console.log('\ncheatsheet: --no-print, stopping after measure. sheet.html is at ' + path.join(work, 'sheet.html'));
  process.exit(0);
}

step('print-pdf.js', 'print', [path.join(work, 'sheet.html'), outAbs]);

const thin = flags.thin === undefined ? '0.25' : String(flags.thin);
if (Number(thin) > 0) {
  const out = execFileSync(process.execPath, [path.join(LIB, 'thinrules.js'), outAbs, outAbs, thin],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], timeout: 120000 });
  if (!quiet) for (const l of out.trim().split('\n')) console.log('  [thin] ' + l);
}

// --preview[=N]: geometry gates cannot see a missing glyph or a highlight that did nothing.
if (flags.preview) {
  const pageNo = flags.preview === true ? 1 : (Number(flags.preview) || 1);
  const png = outAbs.replace(/\.pdf$/i, '') + '.p' + pageNo + '.png';
  step('preview.js', 'preview', [path.join(work, 'sheet.html'), png, String(pageNo)]);
}

// Stamp the build with the PDF it produced. Two sheets rendered from one directory share a
// single .cheatsheet/, so the LAST build is the only one left on disk: verify.js would otherwise
// measure whichever PDF it was pointed at against that sheet and report a confident 9/9 for a
// sheet that is not the one printed (hit by the landscape and portrait demos). Effective knobs
// are read back from the built sheet, so the stamp describes what was actually rendered.
const sheetHtml = fs.readFileSync(path.join(work, 'sheet.html'), 'utf8');
fs.writeFileSync(path.join(work, 'build.json'), JSON.stringify({
  pdf: path.basename(outAbs),
  cols: Number((/column-count:\s*(\d+)/.exec(sheetHtml) || [, 0])[1]),
  base: Number((/\.page\s*\{[^}]*font-size:\s*([\d.]+)pt/.exec(sheetHtml) || [, 0])[1]),
  pages: (sheetHtml.match(/class="page"/g) || []).length
}, null, 2) + '\n', 'utf8');

console.log('\ncheatsheet: wrote ' + outAbs);
console.log('Next:  node "' + path.join(HERE, 'verify.js') + '" "' + outAbs + '"');
