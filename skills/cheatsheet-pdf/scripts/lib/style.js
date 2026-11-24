// style.js - how far is this sheet from the recommended shape?
//
//   node style.js <master.md> [--strict] [--json]
//
// The numbers come from examples/information-theory.md, the reference specimen:
//   8 chapters, 59 sections, 76% ★★★ at 3.6 formula blocks per section, one statements section
//   and one or two past-paper sections per chapter, ~670 characters per section.
//
// POLICY: this is ADVICE. The specimen is a recommended template, not a straitjacket - a user who
// wants a different sheet (no statements, three chapters, only formulas) is allowed to have one.
// Warnings are printed and the build continues. `--strict` turns them into errors for the people
// who DO want the reference shape enforced (a class, a team, an agent that must match the demo).
'use strict';
const fs = require('fs');

// The symbolic part of a math run: "C = 1 - h_2(\epsilon) = 0.531" -> "c=-h_(epsilon)".
// Digits go first (0.1 and 0.25 are the same formula), then TeX decoration and spacing.
function skeleton(run) {
  let s = run.replace(/^\$\$[!?]?/, '').replace(/\$\$/, '').replace(/\$/g, '').trim();
  const parts = s.split('=');
  s = parts.length >= 2 ? parts[0] + '=' + parts[1] : parts[0];
  s = s.replace(/\\text\{[^{}]*\}/g, '')
       .replace(/\\left|\\right/g, '')
       .replace(/[0-9]+(\.[0-9]+)?/g, '')
       .replace(/[\\{}\s,;:]/g, '')
       .toLowerCase();
  return s;
}
// A bare parameter assignment (epsilon=) is not a formula: require an operator in the statement.
function isFormula(s) { return s.length >= 5 && /[a-z]/.test(s) && /[+\-*\/^(]/.test(s); }

const argv = process.argv.slice(2);
const mdPath = argv.find((a) => !a.startsWith('--'));
const asJson = argv.includes('--json');
const strict = argv.includes('--strict');
if (!mdPath) { console.error('style: usage: node style.js <master.md> [--strict] [--json]'); process.exit(2); }
if (!fs.existsSync(mdPath)) { console.error('style: not found: ' + mdPath); process.exit(2); }

const lines = fs.readFileSync(mdPath, 'utf8').split('\n');
const problems = [];
// Level is decided once, here: strict mode promotes the structural rules, the rest stay advice.
const add = (kind, msg, structural) =>
  problems.push({ sev: strict && structural ? 'error' : 'warn', kind, msg });

// ---- parse
const chapters = [];
let cur = null, sec = null, commentDepth = 0;
const closeSec = () => { if (sec && cur) cur.sections.push(sec); sec = null; };

lines.forEach((l, i) => {
  let m = /^#\s+(\d+)\s*·\s*(.+)$/.exec(l);
  if (m) {
    closeSec();
    cur = { n: Number(m[1]), title: m[2].trim(), line: i + 1, sections: [], formulas: 0 };
    chapters.push(cur);
    return;
  }
  m = /^##\s+(★+|☆+)\s*(\d+)\.(\d+)\s+(.+)$/.exec(l);
  if (m && cur) {
    closeSec();
    sec = {
      stars: m[1], chap: Number(m[2]), idx: Number(m[3]), title: m[4].trim(), line: i + 1,
      formulas: 0, bullets: 0, tables: 0, chars: 0,
      exam: /20\d\d\s*Q\d/.test(m[4]), marks: /\d+\s*marks?/i.test(m[4]),
      example: /20\d\d\s*Q\d|work(ed)?\s+example|formula\s+drill|\bexample\b/i.test(m[4]),
      drill: /work(ed)?\s+example|formula\s+drill|scenario|\bexample\b/i.test(m[4]) && !/20\d\d\s*Q\d/.test(m[4]),
      statements: /statements to judge/i.test(m[4]),
    };
    return;
  }
  if (!sec) return;
  // A <!-- ... --> block is authoring notes, not sheet content: it must not inflate the section.
  if (/^\s*<!--/.test(l)) { commentDepth += 1; return; }
  if (commentDepth > 0) { if (/-->/.test(l)) commentDepth -= 1; return; }
  const t = l.trim();
  sec.chars += l.length;
  sec.math = (sec.math || []).concat([...l.matchAll(/\$\$[!?]?[\s\S]*?\$\$|\$[^$\n]*?\$/g)].map((m) => m[0]));
  sec.digits = (sec.digits || 0) + (t.match(/\d/g) || []).length;
  sec.marks = (sec.marks || 0) + (t.match(/==[^=\n]+==/g) || []).length + (t.match(/<mark>/g) || []).length;
  if (sec.drill && /^\|/.test(t)) sec.drillTables = (sec.drillTables || 0) + 1;
  if (/^\$\$[!?]?/.test(t)) { sec.formulas++; if (cur) cur.formulas++; }
  else if (/^- /.test(t) || /^\d+\.\s/.test(t)) sec.bullets++;
  else if (/^\|/.test(t)) sec.tables++;
});
closeSec();

if (!chapters.length) add('shape', 'no "# N · Chapter" heading found - the reference organises by chapter', true);

// ---- header band
if (!lines.some((l) => /^>/.test(l) && /Meta:|<small right-hand line/.test(l))) {
  add('header', 'no "> **Meta:** ..." line - the header band then carries no facts', false);
}

// ---- chapters and numbering
chapters.forEach((c, k) => {
  if (c.n !== k + 1) add('chapters', 'chapter numbering: found "' + c.n + '" at line ' + c.line + ', expected "' + (k + 1) + '"', true);
  if (c.sections.length === 0) add('chapters', 'chapter ' + c.n + ' has no sections', true);
});

const secs = chapters.flatMap((c) => c.sections);
for (const s of secs) {
  const blocks = s.formulas + s.bullets + s.tables;
  if (blocks === 0) {
    add('shape', 'section "' + s.title + '" (line ' + s.line + ') is made only of paragraphs - the reference ' +
      'uses formula boxes, tables or bullets (this still prints, it just will not look like the specimen)', true);
  }
  if (s.formulas > 12) add('shape', 'section "' + s.title + '" has ' + s.formulas + ' formula blocks (reference max 9) - consider splitting it', false);
  if (s.bullets > 10) add('shape', 'section "' + s.title + '" has ' + s.bullets + ' bullets - consider splitting it', false);
  if (s.chars > 2200) add('length', 'section "' + s.title + '" is ' + s.chars + ' chars (reference ~670) - it will dominate the page', false);
}

// ---- order inside a chapter: formulas -> statements -> past papers
for (const c of chapters) {
  // A drill is an example, not a formula block: it may sit after the statements section.
  const kinds = c.sections.map((s) => (s.exam || s.drill ? 'example' : (s.statements ? 'stmt' : 'formula')));
  const firstExam = kinds.indexOf('example');
  const stmtIdx = kinds.indexOf('stmt');
  if (firstExam >= 0 && kinds.slice(firstExam).some((k) => k === 'formula')) {
    add('order', 'chapter ' + c.n + ': a formula section comes after a past-paper section - the reference order ' +
      'is formulas, then statements, then past papers', true);
  }
  if (stmtIdx >= 0 && kinds.slice(stmtIdx).some((k) => k === 'formula')) {
    add('order', 'chapter ' + c.n + ': a formula section comes after the statements section', true);
  }
  const stmt = c.sections.filter((s) => s.statements);
  const exams = c.sections.filter((s) => s.exam);
  if (stmt.length > 1) add('shape', 'chapter ' + c.n + ' has ' + stmt.length + ' statements sections (reference: one)', false);
  if (!stmt.length) {
    add('skeleton', 'chapter ' + c.n + ' has no "Statements to judge" section - each chapter carries its own, ' +
      'they do not belong in one block after the last chapter', true);
  }
  const drills = c.sections.filter((s) => s.drill);
  for (const d of drills) {
    if ((d.digits || 0) < 3) {
      add('skeleton', 'drill "' + d.title + '" carries almost no numbers (' + (d.digits || 0) +
        ' digit(s)) - a drill is a data walk-through: one dataset, then each formula with the values substituted', false);
    }
  }
  for (const d of drills) {
    if ((d.drillTables || 0) > 1) {
      add('shape', 'drill "' + d.title + '" is built on a table - write the data on one line and then ' +
        'each formula as a chained equality (formula = substitution = value); a table cannot split ' +
        'across a column and costs the layout', false);
    }
  }
  if (!c.sections.some((s) => s.example)) {
    add('skeleton', 'chapter ' + c.n + ' has no worked example - add "## ★★★ N.x 2024 Q2 — title (12 marks)" ' +
      'and walk the numbers through', true);
  }
  if (exams.length > 3) add('shape', 'chapter ' + c.n + ' has ' + exams.length + ' past-paper sections (reference: 1-2)', false);
  for (const e of exams) {
    if (!e.marks) add('exam', 'past-paper section "' + e.title + '" does not say "(N marks)"', false);
    if (e.formulas > 3) add('exam', 'past-paper section "' + e.title + '" carries ' + e.formulas + ' formula blocks - the reference keeps the steps as bullets', false);
  }
}

// A drill that re-derives the past paper's formula doubles the space and teaches nothing.
for (const c of chapters) {
  const exams = c.sections.filter((s) => s.exam);
  const drills = c.sections.filter((s) => s.drill);
  if (!exams.length || !drills.length) continue;
  const inExams = new Set();
  for (const e of exams) for (const r of (e.math || [])) { const k = skeleton(r); if (isFormula(k)) inExams.add(k); }
  for (const d of drills) {
    const hits = [];
    for (const r of (d.math || [])) {
      const k = skeleton(r);
      if (isFormula(k) && inExams.has(k)) {
        // Report the drill's own line, digits and all: it is what the author will edit.
        const label = r.replace(/^\$\$[!?]?/, '').replace(/\$\$$/, '').replace(/\$/g, '')
          .split('=').slice(0, 2).join(' = ').replace(/\s+/g, ' ').trim().slice(0, 44);
        hits.push(label);
      }
    }
    if (hits.length) {
      add('duplicate', 'drill "' + d.title + '" repeats formula(s) the past paper in this chapter already ' +
        'computed: ' + [...new Set(hits)].slice(0, 3).join('; ') + ' - drill a formula the exam does not cover, ' +
        'or drop the repeated line', false);
    }
  }
}

// Aggregate, not per chapter: eight identical warnings bury the one that matters.
const noDrill = chapters.filter((c) => !c.sections.some((s) => s.drill) && c.sections.some((s) => s.exam)).map((c) => c.n);
if (noDrill.length) {
  add('skeleton', 'chapter(s) ' + noDrill.join(', ') + ' have past papers but no formula drill - a drill is ' +
    'a data walk-through: one dataset, then each formula as a chained equality', false);
}
const noMark = chapters.filter((c) => !c.sections.some((s) => !s.statements && (s.marks || 0) > 0)).map((c) => c.n);
if (noMark.length) {
  add('highlight', 'chapter(s) ' + noMark.join(', ') + ' highlight no name - wrap the formula/theorem names in ' +
    '==name== (or <mark>) inside the formula/theorem section, so a reader can find them while scanning', false);
}

// ---- star mix
const count = { '★★★': 0, '★★': 0, '★': 0, '☆': 0 };
for (const s of secs) count[s.stars] = (count[s.stars] || 0) + 1;
const n = secs.length || 1;
const topShare = Math.round((count['★★★'] || 0) / n * 100);
if (topShare < 40) add('stars', 'only ' + topShare + '% of sections are ★★★ (reference 76%) - the sheet under-marks its core', false);
if (topShare > 90 && n > 10) add('stars', topShare + '% of sections are ★★★ - the colour scale carries no information', false);

// ---- statements sections
for (const s of secs.filter((x) => x.statements)) {
  if (s.formulas > 1) add('shape', 'statements section "' + s.title + '" should be bullets, not formulas (' + s.formulas + ' found)', false);
  if (s.bullets < 3 || s.bullets > 8) add('shape', 'statements section "' + s.title + '" has ' + s.bullets + ' bullets (reference 5-7)', false);
}

// ---- report
const errors = problems.filter((p) => p.sev === 'error');
const warns = problems.filter((p) => p.sev === 'warn');
const stats = {
  chapters: chapters.length, sections: secs.length, stars: count, topShare,
  formulas: secs.reduce((a, s) => a + s.formulas, 0),
  exams: secs.filter((s) => s.exam).length,
  statements: secs.filter((s) => s.statements).length,
  chars: secs.reduce((a, s) => a + s.chars, 0),
  strict,
};
const perChapter = chapters.map((c) => ({
  n: c.n, title: c.title, sections: c.sections.length,
  formulas: c.sections.reduce((a, s) => a + s.formulas, 0),
  statements: c.sections.filter((s) => s.statements).length,
  examples: c.sections.filter((s) => s.example).length,
  drills: c.sections.filter((s) => s.drill).length,
  chars: c.sections.reduce((a, s) => a + s.chars, 0),
}));
if (asJson) { console.log(JSON.stringify({ stats: Object.assign({ perChapter }, stats), problems }, null, 2)); process.exit(errors.length ? 1 : 0); }

// Coverage table: one line per chapter, so a thin chapter is visible before the PDF exists.
console.log('chapter'.padEnd(34) + 'sections formulas stmt exam drill chars');
for (const c of perChapter) {
  console.log(((c.n + ' · ' + c.title).slice(0, 33)).padEnd(34) +
    String(c.sections).padStart(8) + String(c.formulas).padStart(9) +
    String(c.statements).padStart(5) + String(c.examples - c.drills).padStart(5) +
    String(c.drills).padStart(6) + String(c.chars).padStart(7));
}
for (const p of errors) console.log('STYLE ERROR ' + p.kind.padEnd(8) + ' ' + p.msg);
for (const p of warns) console.log('STYLE WARN  ' + p.kind.padEnd(8) + ' ' + p.msg);
console.log('STYLE ' + errors.length + ' error(s), ' + warns.length + ' warning(s)   ' +
  stats.chapters + ' ch, ' + stats.sections + ' sec, ' + stats.formulas + ' formulas, ' +
  stats.exams + ' exam sections, ' + stats.statements + ' statements, top ' + stats.topShare + '%' +
  (strict ? '' : '   (advice only; --strict makes it fatal)'));
process.exit(errors.length ? 1 : 0);
