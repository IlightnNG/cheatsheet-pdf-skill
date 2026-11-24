// lint.js - static checks on the Markdown master (and on the HTML that md2body produced).
//
//   node lint.js <master.md> [--structure]
//
// Every check here exists because the corresponding mistake reached a printed PDF silently:
// literal "**" from emphasis spanning math, a box-drawing arrow whose glyph the embedded font
// did not have, a table pipe escaped inside math, a chapter heading lost so two chapters merged,
// and the same past-paper question answered twice.
//
// Exit codes: 0 all clear, 1 there is at least one ERROR, 2 usage.
'use strict';
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const mdPath = argv.find((a) => !a.startsWith('--'));
const structureOnly = argv.includes('--structure');
if (!mdPath) { console.error('lint: usage: node lint.js <master.md> [--structure]'); process.exit(2); }
if (!fs.existsSync(mdPath)) { console.error('lint: not found: ' + mdPath); process.exit(2); }

const md = fs.readFileSync(mdPath, 'utf8');
const work = process.env.SHEET_DIR || path.join(path.dirname(path.resolve(mdPath)), '.cheatsheet');
const bodyPath = path.join(work, 'body.html');
const sheetPath = path.join(work, 'sheet.html');
const body = fs.existsSync(bodyPath) ? fs.readFileSync(bodyPath, 'utf8') : '';

const problems = [];
const add = (sev, kind, msg, line) =>
  problems.push({ sev, kind, msg, line: line === undefined ? null : line });

// ---------------------------------------------------------------- 1. output markup leaks
// These are the things that PRINT as literal characters when the parser did not consume them.
// Note the split of targets: body.html legitimately still contains the $$/$$! delimiters (KaTeX
// runs in build.js), so an unconsumed priority marker is only a defect in the FINAL sheet.html.
if (body) {
  // Math is still verbatim in body.html, so strip it first: "__" and "~~" are legitimate inside
  // subscripts and \xrightarrow labels, and only a leak in the PROSE matters.
  const bodyNoMath = body.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g, '');
  const leaks = [
    { re: /\*\*/g, text: bodyNoMath, what: 'literal "**" in the built body', why: 'emphasis must not straddle a blank line or a table cell boundary' },
    { re: /__[^_\n]{1,40}__/g, text: bodyNoMath, what: 'unsupported "__bold__"', why: 'use **bold**' },
    { re: /~~[^~\n]{1,40}~~/g, text: bodyNoMath, what: 'unsupported "~~strike~~"', why: 'strikethrough is not supported; drop it or use ==mark==' },
    { re: /==[^=\n]{1,40}==/g, text: bodyNoMath, what: 'literal "==" in the built body', why: 'highlight syntax is ==text== without spaces inside' },
    { re: /\\textbf/g, text: body, what: 'literal "\\textbf"', why: 'LaTeX text commands only work INSIDE math; use plain text or <b>' },
    { re: /<span[\s>]/g, text: body, what: 'raw <span> in the built body', why: 'only <mark> is themed; raw spans bypass the palette' },
  ];
  for (const l of leaks) {
    const n = (l.text.match(l.re) || []).length;
    if (n) add('error', 'markup', n + 'x ' + l.what + ' - ' + l.why);
  }
}
// The final-sheet check ("$$!" must be consumed by KaTeX) cannot live here: lint runs BEFORE the
// build, so sheet.html is the previous build. verify.js owns that gate instead.

// ---------------------------------------------------------------- 2. characters the fonts lack
// Two distinct failures were observed. (a) Box-drawing strokes (U+2500..257F) have no glyph in
// the body font at all, so "0 ─ε→ 0" printed as "0 ε 0". (b) A thin arrow inside a code span is
// set in the monospace stack, which also lacked it. Plain prose arrows (→, ⇒) are fine and are
// used all over the sheet, so they are NOT flagged.
const BOXDRAW = /[\u2500-\u257F]/;
const ARROW = /[\u2190-\u21FF]/;
const lines = md.split(/\r?\n/);
let decorLine = null, decorKind = '';
lines.forEach((l, i) => {
  if (decorLine !== null) return;
  const bare = l.replace(/\$[^$]*\$/g, '');
  if (BOXDRAW.test(bare)) { decorLine = i + 1; decorKind = 'box-drawing stroke'; return; }
  const codeSpans = [...bare.matchAll(/`([^`]*)`/g)].map((m) => m[1]).join(' ');
  if (ARROW.test(codeSpans)) { decorLine = i + 1; decorKind = 'arrow inside a code span'; }
});
if (decorLine) {
  add('error', 'glyph',
    decorKind + ' outside math at line ' + decorLine +
    ' - the embedded fonts have no glyph for it; draw the diagram with \\xrightarrow inside $$...$$' +
    (decorKind === 'arrow inside a code span' ? ', or write the arrow as ASCII' : ''));
}

// ---------------------------------------------------------------- 3. prose hidden inside formulas
lines.forEach((l, i) => {
  const m = /^\$\$[!?]?([\s\S]*)\$\$\s*$/.exec(l);
  if (!m) return;
  const bodyTex = m[1];
  const texts = [...bodyTex.matchAll(/\\text\{([^{}]*)\}/g)].map((x) => x[1]);
  const words = texts.join(' ').trim().split(/\s+/).filter(Boolean).length;
  if (words >= 5) {
    add('warn', 'formula-prose',
      'display formula at line ' + (i + 1) + ' carries ' + words + ' words of \\text{...} ' +
      '- it cannot wrap and widens the column; move the prose outside the formula');
  }
});

// ---------------------------------------------------------------- 4. escaped pipes in tables
lines.forEach((l, i) => {
  if (/^\s*\|/.test(l) && /\\\|/.test(l)) {
    add('error', 'table', 'escaped pipe inside a table row at line ' + (i + 1) +
      ' - use \\mid or \\lVert inside math');
  }
});

// ---------------------------------------------------------------- 5. structure: chapters, sections, questions
const chapters = [];
const sections = [];
const examHeads = [];
let titleSeen = false;
lines.forEach((l, i) => {
  let m = /^#\s+(\d+)\s*·\s*(.+)$/.exec(l);
  if (m) { chapters.push({ n: Number(m[1]), title: m[2].trim(), line: i + 1 }); return; }
  // Every "# ..." becomes a chapter bar in the render, so a top-level heading that is not a chapter
  // prints as a second half of the sheet (the "filler after the last chapter" failure). The one
  // allowed exception is the very first title line.
  if (/^#\s+/.test(l)) {
    if (!titleSeen && !chapters.length) { titleSeen = true; return; }
    add('error', 'top-level',
      'top-level heading at line ' + (i + 1) + ' is not a chapter: "' + l.replace(/^#\s+/, '').slice(0, 48) +
      '" - only "# N · Chapter" may use one #; move the content inside a chapter');
    return;
  }
  m = /^##\s+(★+|☆+)\s*(\d+)\.(\d+)\s+(.+)$/.exec(l);
  if (m) {
    sections.push({ chap: Number(m[2]), idx: Number(m[3]), title: m[4].trim(), line: i + 1, stars: m[1] });
    if (/20\d\d\s*Q\d/.test(m[4])) examHeads.push({ label: (m[4].match(/20\d\d\s*Q\d/) || [])[0], title: m[4].trim(), line: i + 1 });
    return;
  }
  // a heading with no star run: md2body prints it as p1 (grey), which usually means a typo
  if (/^##\s+[^★☆]/.test(l)) add('warn', 'stars', 'section heading without a star run at line ' + (i + 1));
});

const chNums = chapters.map((c) => c.n);
for (let k = 0; k < chNums.length; k++) {
  if (chNums[k] !== k + 1) {
    add('error', 'structure',
      'chapter numbering breaks at line ' + chapters[k].line + ': found "' + chNums[k] +
      '", expected "' + (k + 1) + '" (a lost chapter heading merges two chapters)');
    break;
  }
}
const byChap = {};
for (const s of sections) (byChap[s.chap] = byChap[s.chap] || []).push(s);
for (const [c, list] of Object.entries(byChap)) {
  list.sort((a, b) => a.line - b.line);
  list.forEach((s, k) => {
    if (s.idx !== k + 1) {
      add('error', 'structure',
        'section numbering in chapter ' + c + ' breaks at line ' + s.line + ': "' + c + '.' + s.idx +
        '", expected "' + c + '.' + (k + 1) + '" (run --renumber to fix)');
    }
  });
}
// One exam question may legitimately be split across two chapters when it spans two topics
// (2023 Q2 = source coding part (a)(b) + extraction part (c)(d)). A split is recognisable from
// the part markers in the titles; without them, the same question answered twice is an error.
const examByLabel = {};
for (const e of examHeads) (examByLabel[e.label] = examByLabel[e.label] || []).push(e);
for (const [label, list] of Object.entries(examByLabel)) {
  if (list.length < 2) continue;
  const split = list.every((e) => /\(\w\)|part\b|—/.test(e.title));
  add(split ? 'warn' : 'error', 'duplicate',
    'past-paper question "' + label + '" appears in ' + list.length + ' sections' +
    (split ? ' (split by part markers - keep if intentional)' : ' (remove one of them)'));
}

// ---------------------------------------------------------------- report
const errors = problems.filter((p) => p.sev === 'error');
const warns = problems.filter((p) => p.sev === 'warn');
const showStructure = structureOnly;
if (showStructure) {
  console.log('lint: ' + path.basename(mdPath) + '   structure');
  for (const c of chapters) console.log('  ch ' + c.n + '  ' + c.title + '   (line ' + c.line + ')');
  for (const s of sections) console.log('    ' + s.chap + '.' + s.idx + '  ' + s.title);
  console.log('  ' + chapters.length + ' chapter(s), ' + sections.length + ' section(s), ' +
              examHeads.length + ' past-paper section(s)');
} else {
  for (const p of errors) console.log('LINT ERROR ' + p.kind + '  ' + p.msg);
  for (const p of warns) console.log('LINT WARN  ' + p.kind + '  ' + p.msg);
  console.log('LINT ' + errors.length + ' error(s), ' + warns.length + ' warning(s)');
}
process.exit(errors.length ? 1 : 0);
