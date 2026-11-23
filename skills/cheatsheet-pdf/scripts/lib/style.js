// style.js - does this sheet have the SHAPE of the reference sheet?
//
//   node style.js <master.md> [--json]
//
// SKILL.md used to describe the shape in prose ("keep the teaching order", "spend the page
// 60/25/15"), and two authors reading the same paragraph produced visibly different sheets: one
// wrote formula blocks, the other wrote paragraphs; one gave every chapter a statements section,
// the other gave none. Prose is not a contract. This file is the contract.
//
// The numbers come from examples/information-theory.md, the reference specimen:
//   8 chapters, 59 sections, 76% ★★★ at 3.6 formula blocks per section, one statements section
//   and one or two past-paper sections per chapter, ~670 characters per section.
'use strict';
const fs = require('fs');

const argv = process.argv.slice(2);
const mdPath = argv.find((a) => !a.startsWith('--'));
const asJson = argv.includes('--json');
if (!mdPath) { console.error('style: usage: node style.js <master.md> [--json]'); process.exit(2); }
if (!fs.existsSync(mdPath)) { console.error('style: not found: ' + mdPath); process.exit(2); }

const lines = fs.readFileSync(mdPath, 'utf8').split('\n');
const problems = [];
const add = (sev, kind, msg) => problems.push({ sev, kind, msg });

// ---- parse
const chapters = [];
let cur = null, sec = null;
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
      formulas: 0, bullets: 0, tables: 0, chars: 0, prose: 0,
      exam: /20\d\d\s*Q\d/.test(m[4]), marks: /\d+\s*marks?/i.test(m[4]),
      statements: /statements to judge/i.test(m[4]),
    };
    return;
  }
  if (!sec) return;
  const t = l.trim();
  sec.chars += l.length;
  if (/^\$\$[!?]?/.test(t)) { sec.formulas++; if (cur) cur.formulas++; }
  else if (/^- /.test(t) || /^\d+\.\s/.test(t)) sec.bullets++;
  else if (/^\|/.test(t)) sec.tables++;
  else if (t && !/^>/.test(t) && !/^\*/.test(t)) sec.prose++;
});
closeSec();

if (!chapters.length) {
  add('error', 'shape', 'no "# N · Chapter" heading found - the sheet must be chapter-organised');
}

// ---- 1. the header band is one line of facts
const head = lines.find((l) => /^>/.test(l) && /\*\*Meta:\*\*|Meta:/.test(l));
if (!head) add('warn', 'header', 'no "> **Meta:** ..." line - the header band then carries no facts');

// ---- 2. chapters are numbered 1..N
chapters.forEach((c, k) => {
  if (c.n !== k + 1) add('error', 'chapters', 'chapter numbering: found "' + c.n + '" at line ' + c.line + ', expected "' + (k + 1) + '"');
  if (c.sections.length === 0) add('error', 'chapters', 'chapter ' + c.n + ' has no sections');
});

// ---- 3. every section is a block, not a paragraph
const secs = chapters.flatMap((c) => c.sections);
for (const s of secs) {
  const blocks = s.formulas + s.bullets + s.tables;
  if (blocks === 0) {
    add('error', 'shape', 'section "' + s.title + '" (line ' + s.line + ') has no formula, table or bullet - ' +
      'a section must be made of blocks; prose-only sections are what makes two sheets look different');
  }
  if (s.stars !== '★★★' && s.formulas >= 4) {
    add('warn', 'stars', 'section "' + s.title + '" is ' + s.stars + ' but carries ' + s.formulas + ' formula blocks');
  }
  if (s.formulas > 10) add('warn', 'shape', 'section "' + s.title + '" has ' + s.formulas + ' formula blocks (reference max 9) - split it');
  if (s.bullets > 8) add('warn', 'shape', 'section "' + s.title + '" has ' + s.bullets + ' bullets - split it');
  if (s.chars > 1400) add('warn', 'length', 'section "' + s.title + '" is ' + s.chars + ' chars (reference ~670) - it will dominate the page');
}

// ---- 4. a chapter runs formulas -> statements -> past papers
for (const c of chapters) {
  const kinds = c.sections.map((s) => (s.envExam = s.exam) ? 'exam' : (s.statements ? 'stmt' : 'formula'));
  const firstExam = kinds.indexOf('exam');
  const stmtIdx = kinds.indexOf('stmt');
  if (firstExam >= 0 && kinds.slice(firstExam).some((k) => k === 'formula')) {
    add('error', 'order', 'chapter ' + c.n + ': a formula section comes after a past-paper section - ' +
      'the order is formulas, then statements, then past papers');
  }
  if (stmtIdx >= 0 && kinds.slice(stmtIdx).some((k) => k === 'formula')) {
    add('error', 'order', 'chapter ' + c.n + ': a formula section comes after the statements section');
  }
  const stmt = c.sections.filter((s) => s.statements);
  const exams = c.sections.filter((s) => s.exam);
  if (stmt.length > 1) add('warn', 'shape', 'chapter ' + c.n + ' has ' + stmt.length + ' statements sections (reference: one)');
  if (exams.length > 3) add('warn', 'shape', 'chapter ' + c.n + ' has ' + exams.length + ' past-paper sections (reference: 1-2)');
  for (const e of exams) {
    if (!e.marks) add('warn', 'exam', 'past-paper section "' + e.title + '" does not say "(N marks)"');
    if (e.formulas > 3) add('warn', 'exam', 'past-paper section "' + e.title + '" carries ' + e.formulas + ' formula blocks - keep the steps as bullets');
  }
  if (c.formulas < 6) add('warn', 'shape', 'chapter ' + c.n + ' has only ' + c.formulas + ' formula blocks in total');
}

// ---- 5. the star mix drives the colours; a flat sheet has no priorities
const count = { '★★★': 0, '★★': 0, '★': 0, '☆': 0 };
for (const s of secs) count[s.stars] = (count[s.stars] || 0) + 1;
const n = secs.length || 1;
const topShare = Math.round((count['★★★'] || 0) / n * 100);
if (topShare < 40) add('warn', 'stars', 'only ' + topShare + '% of sections are ★★★ (reference 76%) - the sheet under-marks its core');
if (topShare > 90 && n > 10) add('warn', 'stars', topShare + '% of sections are ★★★ - the colour scale carries no information');

// ---- 6. statements sections look the same everywhere
for (const s of secs.filter((x) => x.statements)) {
  if (s.formulas > 1) add('warn', 'shape', 'statements section "' + s.title + '" should be bullets, not formulas (' + s.formulas + ' found)');
  if (s.bullets < 3 || s.bullets > 8) add('warn', 'shape', 'statements section "' + s.title + '" has ' + s.bullets + ' bullets (reference 5-7)');
}

// ---- report
const errors = problems.filter((p) => p.sev === 'error');
const warns = problems.filter((p) => p.sev === 'warn');
const stats = {
  chapters: chapters.length,
  sections: secs.length,
  stars: count,
  topShare,
  formulas: secs.reduce((a, s) => a + s.formulas, 0),
  exams: secs.filter((s) => s.exam).length,
  statements: secs.filter((s) => s.statements).length,
  chars: secs.reduce((a, s) => a + s.chars, 0),
};
if (asJson) { console.log(JSON.stringify({ stats, problems }, null, 2)); process.exit(errors.length ? 1 : 0); }

for (const p of errors) console.log('STYLE ERROR ' + p.kind.padEnd(8) + ' ' + p.msg);
for (const p of warns) console.log('STYLE WARN  ' + p.kind.padEnd(8) + ' ' + p.msg);
console.log('STYLE ' + errors.length + ' error(s), ' + warns.length + ' warning(s)   ' +
  stats.chapters + ' ch, ' + stats.sections + ' sec, ' + stats.formulas + ' formulas, ' +
  stats.exams + ' exam sections, ' + stats.statements + ' statements, top ' + stats.topShare + '%');
process.exit(errors.length ? 1 : 0);
