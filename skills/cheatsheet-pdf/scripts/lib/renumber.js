// renumber.js - normalise "## N.M Title" numbering per chapter, without touching the master.
//
//   node renumber.js <master.md> <out.md>
//
// The numbering drifted every time a section was inserted by hand (4.6 after 4.4, two 5.2s, a lost
// chapter heading that merged chapters 6 and 7). Renumbering is mechanical, so it belongs in a
// script: the author keeps editing without thinking about numbers.
'use strict';
const fs = require('fs');
const path = require('path');

const [, , src, dst] = process.argv;
if (!src || !dst) { console.error('renumber: usage: node renumber.js <master.md> <out.md>'); process.exit(2); }
if (!fs.existsSync(src)) { console.error('renumber: not found: ' + src); process.exit(2); }

const lines = fs.readFileSync(src, 'utf8').split('\n');
let chap = 0, idx = 0, changed = 0;
const out = lines.map((l) => {
  if (/^# \d+ · /.test(l)) { chap = Number(l.match(/^# (\d+) ·/)[1]); idx = 0; return l; }
  const m = /^(## )(★+|☆+)?\s*(\d+)\.(\d+)(\s+.*)$/.exec(l);
  if (!m) return l;
  idx += 1;
  const want = chap + '.' + idx;
  const have = m[3] + '.' + m[4];
  if (want !== have) changed++;
  return m[1] + (m[2] ? m[2] + ' ' : '') + want + m[5];
});

fs.mkdirSync(path.dirname(path.resolve(dst)), { recursive: true });
fs.writeFileSync(dst, out.join('\n'), 'utf8');
console.log('renumber: ' + changed + ' heading(s) renumbered -> ' + dst);
