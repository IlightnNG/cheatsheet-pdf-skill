#!/usr/bin/env node
// cheatsheet.js - the one command that turns a Markdown master into a one-page A4 cheat sheet.
//
//   node cheatsheet.js <master.md> [out.pdf] [options]
//
// Stage A (authoring the Markdown) is the agent's job - see SKILL.md next to this script.
// This is stage B: render that Markdown to a PDF and check the result.
//
// Options
//   --base=<pt>    base (prose) font size                  [stylesheet: 5.5]
//   --math=<em>    math size relative to prose             [stylesheet: ~0.93]
//   --cols=<n>     number of columns                       [stylesheet: 6]
//   --pages=<n>    pages to fill; 1 for a single sheet      [2]
//   --gap=<mm>     column gutter                           [stylesheet: 1.9]
//   --split        advanced formula line breaking (breaks at relations, paginates)
//   --css=<file>   append a stylesheet on top of sheet.css (portrait, fonts, colours)
//   --thin=<pt>    rewrite PDF hairlines to this thickness; 0 disables   [0.25]
//   --no-print     stop after measuring (layout dry run, no PDF)
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

// ---------------------------------------------------------------- arguments
const KNOWN = ['base', 'math', 'cols', 'pages', 'gap', 'split', 'css', 'thin', 'no-print', 'quiet', 'help', 'version'];
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
console.log('cheatsheet: ' + path.basename(mdAbs) + '  ->  ' + outAbs);
console.log('  work dir   ' + work);
console.log('  line break ' + (flags.split ? 'advanced (split at relations + paginate)' : 'conservative (one formula per line)'));
console.log('  knobs      base=' + (flags.base || 'css default') + '  math=' + (flags.math || 'css default') +
            '  cols=' + (flags.cols || 'css default'));

step('md2body.js', 'md2body', [mdAbs]);
const buildOut = step('build.js', 'build');
if (/WARNING - \d+ formula\(s\) failed/.test(buildOut)) {
  console.error('\ncheatsheet: KaTeX could not typeset every formula - fix the Markdown first.');
  process.exit(1);
}
step('paginate.js', 'paginate');
step('fit-formulas.js', 'fit');
// Distribute blocks over the requested pages BEFORE measuring: a page is a fixed box, so the
// split has to be decided (and its overflow reported) rather than left to the printer, which
// clips silently. See lib/paginate-pages.js.
step('paginate-pages.js', 'pages');
step('measure.js', 'measure');

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
