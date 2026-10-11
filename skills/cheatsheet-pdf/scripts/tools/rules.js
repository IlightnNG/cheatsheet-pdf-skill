// rules.js - read the actual fraction-rule geometry out of the printed PDF.
// The bars are filled rectangles in the content stream, so their height in points is
// ground truth: no viewer scaling, no screenshot artefacts.
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];
const buf = fs.readFileSync(file);
const s = buf.toString('latin1');

// walk every stream object, inflate it, and collect rectangle fills
const tallies = new Map();
const re = /stream\r?\n/g;
let m;
const nRect = [];
while ((m = re.exec(s)) !== null) {
  const start = m.index + m[0].length;
  const end = s.indexOf('endstream', start);
  if (end < 0) continue;
  const raw = buf.subarray(start, end);
  let txt;
  try { txt = zlib.inflateSync(raw).toString('latin1'); } catch (e) { continue; }
  if (txt.indexOf(' re') < 0) continue;
  // rectangle ops: "x y w h re"
  const rr = /(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+re\b/g;
  let q;
  while ((q = rr.exec(txt)) !== null) {
    const w = parseFloat(q[3]), h = parseFloat(q[4]);
    if (w > 0 && h > 0 && h < 3) {
      const key = h.toFixed(3);
      tallies.set(key, (tallies.get(key) || 0) + 1);
    }
    nRect.push({ w: w, h: h });
  }
}

const rows = [...tallies.entries()].sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
console.log('rectangle fills with height < 3pt (fraction / sqrt / overline rules):');
console.log('  height(pt)   count    = mm');
for (const [h, c] of rows.slice(0, 18)) {
  console.log('  ' + h.padStart(9) + '   ' + String(c).padStart(5) + '    ' + (parseFloat(h) * 25.4 / 72).toFixed(3));
}
const total = rows.reduce((a, r) => a + r[1], 0);
console.log('  total thin rects: ' + total + '   all rects: ' + nRect.length);
