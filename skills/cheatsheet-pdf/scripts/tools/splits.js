// splits.js - dry-run the formula line breaker and print the resulting lines.
//
//   node splits.js [filter] [master.md]
//
//   filter     only report formulas whose source contains this substring
//   master.md  the Markdown master (or set SHEET_MD); required
//
// Uses the same splitFormula() as build.js, so what it prints is exactly what the sheet will
// lay out: each \qquad starts a new group, and within a group the only wrap opportunity is in
// front of a relation.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'build.js'), 'utf8');

// reuse the real implementation instead of a copy that can drift
const body = src.slice(src.indexOf('const REL_CMDS'), src.indexOf('function convertFragment'));
const factory = new Function(body + '\nreturn { splitFormula, REL_CMDS, FORCED };');
const { splitFormula } = factory();

const filter = process.argv[2] || '';
const mdPath = process.argv[3] || process.env.SHEET_MD;
if (!mdPath) {
  console.error('splits.js: pass the Markdown master, e.g.  node splits.js "" sheet.md');
  process.exit(2);
}
const md = fs.readFileSync(mdPath, 'utf8');
let n = 0;
const re = /\$\$([!?]?)([\s\S]*?)\$\$/g;
let m;
while ((m = re.exec(md)) !== null) {
  const tex = m[2];
  if (/^\s*$/.test(tex)) continue;
  const segs = splitFormula(tex);
  if (segs.length === 1) continue;                       // single line: nothing to report
  if (filter && tex.indexOf(filter) < 0) continue;
  n++;
  const lines = [[]];
  segs.forEach((s, i) => { if (s.brk === 'force' && i > 0) lines.push([]); lines[lines.length - 1].push(s.tex); });
  console.log('--- ' + (m[1] || ' ') + ' ' + tex.replace(/\s+/g, ' ').slice(0, 78));
  lines.forEach((ln, i) => console.log('   L' + (i + 1) + ': ' + ln.join('  <wrap>  ').replace(/\{\}/g, '')));
}
console.log('\nmulti-line formulas: ' + n);
