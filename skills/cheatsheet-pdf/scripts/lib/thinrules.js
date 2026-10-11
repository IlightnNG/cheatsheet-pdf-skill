// thinrules.js - fix the one thing Chrome's PDF export cannot do: thin hairlines.
//
//   node thinrules.js <in.pdf> <out.pdf> [thicknessPt]
//
// Why this exists: KaTeX draws the \frac rule (and \overline / \underline / \hline) as a
// border-bottom of 0.04em. When exporting to PDF, Skia rounds such a rectangle UP to one
// device unit, which in PDF space is a full point. Every rule therefore prints as a 1pt
// slab - about 5x heavier than LaTeX's, and very obtrusive at a 4.8pt math size. CSS
// cannot fix it: transform, rotate and opacity all still produce a 1pt rectangle
// (measured). So the rectangles are rewritten in the content stream instead, which is
// exact and verifiable.
//
// The file is rebuilt with a fresh cross-reference table, so any length changes are safe.
const fs = require('fs');
const zlib = require('zlib');

const [inp, outp, thickArg] = process.argv.slice(2);
if (!inp || !outp) { console.error('usage: node thinrules.js <in.pdf> <out.pdf> [pt]'); process.exit(1); }
const THICK = Number(thickArg || 0.25);

const buf = fs.readFileSync(inp);
let s = buf.toString('latin1');

if (!/^%PDF-/.test(s)) { console.error('not a PDF'); process.exit(1); }
if (/\/ObjStm/.test(s)) { console.error('object streams present - unsupported'); process.exit(1); }

// ---------- pass 1: rewrite content streams ----------
let thinned = 0, streamsTouched = 0, seen = [];
s = s.replace(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+re\b/g, (m, x, y, w, h) => {
  const H = parseFloat(h), W = parseFloat(w);
  if (H > 1.6 || W < 1.0) return m;              // keep page/box fills, keep tiny glyph boxes
  seen.push(H);
  if (H > 1.01) return m;                        // only the snapped 1pt rules
  const ny = parseFloat(y) + (H - THICK) / 2;    // keep the rule centred where it was
  thinned++;
  return x + ' ' + ny.toFixed(4) + ' ' + w + ' ' + THICK.toFixed(4) + ' re';
});

const uniq = [...new Set(seen.map((v) => v.toFixed(3)))].sort();
console.log('rect heights <=1.6pt found: ' + uniq.join(', ') + '   (total ' + seen.length + ')');

// ---------- pass 2: re-deflate every stream whose text changed ----------
// Walk objects, inflate each FlateDecode stream, rewrite, deflate, fix /Length.
const objRe = /(\d+)\s+(\d+)\s+obj\b/g;
const objs = [];
let m;
while ((m = objRe.exec(s)) !== null) objs.push({ num: parseInt(m[1], 10), start: m.index });

const pieces = [];
let cursor = 0;
for (let i = 0; i < objs.length; i++) {
  const o = objs[i];
  const endIdx = s.indexOf('endobj', o.start);
  if (endIdx < 0) continue;
  const objText = s.slice(o.start, endIdx + 6);
  const sm = /stream(\r?\n)/.exec(objText);
  let newObj = objText;
  if (sm && /\/FlateDecode/.test(objText)) {
    const dataStart = sm.index + sm[0].length;
    const esIdx = objText.lastIndexOf('endstream');
    let data = objText.slice(dataStart, esIdx).replace(/\r?\n$/, '');
    let txt = null;
    try { txt = zlib.inflateSync(Buffer.from(data, 'latin1')); } catch (e) { txt = null; }
    if (txt) {
      let t = txt.toString('latin1');
      const before = t;
      t = t.replace(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+re\b/g, (mm, x, y, w, h) => {
        const H = parseFloat(h), W = parseFloat(w);
        if (H > 1.01 || H < 0.5 || W < 1.0) return mm;
        const ny = parseFloat(y) + (H - THICK) / 2;
        return x + ' ' + ny.toFixed(4) + ' ' + w + ' ' + THICK.toFixed(4) + ' re';
      });
      if (t !== before) {
        const packed = zlib.deflateSync(Buffer.from(t, 'latin1'), { level: 9 });
        const head = objText.slice(0, dataStart);
        const tail = objText.slice(esIdx);
        newObj = head + packed.toString('latin1') + '\n' + tail;
        // /Length must match the new byte count
        newObj = newObj.replace(/\/Length\s+(\d+)(?!\s+\d+\s+R)/, '/Length ' + packed.length);
        streamsTouched++;
      }
    }
  }
  pieces.push({ num: o.num, text: newObj });
}

// ---------- pass 3: rebuild with a fresh xref table ----------
const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
let body = '';
const offsets = new Map();
for (const p of pieces) {
  offsets.set(p.num, header.length + body.length);
  body += p.num + ' 0 obj\n' + p.text.replace(/^\d+\s+\d+\s+obj\s*/, '') + '\nendobj\n';
}

const size = Math.max(...pieces.map((p) => p.num)) + 1;
const xrefOff = header.length + body.length;
let xref = 'xref\n0 ' + size + '\n0000000000 65535 f \n';
for (let n = 1; n < size; n++) {
  const off = offsets.has(n) ? offsets.get(n) : 0;
  xref += String(off).padStart(10, '0') + ' 00000 ' + (offsets.has(n) ? 'n' : 'f') + ' \n';
}

const root = (/\/Root\s+(\d+)\s+\d+\s+R/.exec(s) || [, null])[1];
const info = (/\/Info\s+(\d+)\s+\d+\s+R/.exec(s) || [, null])[1];
if (!root) { console.error('/Root not found'); process.exit(1); }
let trailer = 'trailer\n<< /Size ' + size + ' /Root ' + root + ' 0 R';
if (info) trailer += ' /Info ' + info + ' 0 R';
trailer += ' >>\nstartxref\n' + xrefOff + '\n%%EOF\n';

const outStr = header + body + xref + trailer;
fs.writeFileSync(outp, Buffer.from(outStr, 'latin1'));

console.log('thinned rects        : ' + thinned + '  -> ' + THICK + 'pt');
console.log('streams recompressed : ' + streamsTouched);
console.log('objects / size       : ' + pieces.length + ' / ' + size);
console.log('written              : ' + outp + '  (' + (outStr.length / 1024).toFixed(1) + ' KB)');
