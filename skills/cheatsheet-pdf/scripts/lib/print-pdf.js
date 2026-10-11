// print-pdf.js - render sheet.html to a PDF with headless Chrome, then report what the PDF
// actually contains (page count, paper box, embedded fonts).
//
//   node print-pdf.js <sheet.html> <out.pdf>
//
// Chrome's "N bytes written" line on stderr is the success signal; anything else means the
// file may be missing or truncated, so the result is verified by reading it back.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const env = require('./env');

const [inp, outp] = process.argv.slice(2);
if (!inp || !outp) {
  console.error('print-pdf: usage: node print-pdf.js <sheet.html> <out.pdf>');
  process.exit(2);
}
if (!fs.existsSync(inp)) {
  console.error('print-pdf: input not found: ' + inp);
  process.exit(2);
}
fs.mkdirSync(path.dirname(path.resolve(outp)), { recursive: true });

const prof = env.profile('print');
execFileSync(env.chromePath(), env.baseArgs(prof).concat([
  '--no-pdf-header-footer', '--virtual-time-budget=6000',
  '--print-to-pdf-no-header', '--print-to-pdf=' + path.resolve(outp),
  env.fileUrl(inp)
]), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: env.timeoutMs() });

if (!fs.existsSync(outp)) {
  console.error('print-pdf: Chrome produced no file (check CHROME_PATH).');
  process.exit(1);
}

const bytes = fs.readFileSync(outp);
const s = bytes.toString('latin1');
const pages = (/\/Count\s+(\d+)/.exec(s) || [, '?'])[1];
const box = (/\/MediaBox\s*\[([^\]]*)\]/.exec(s) || [, '?'])[1].trim();
const wpt = Math.round(parseFloat(box.split(/\s+/)[2] || 0));
const hpt = Math.round(parseFloat(box.split(/\s+/)[3] || 0));
const land = wpt > hpt;
const fonts = (s.match(/\+KaTeX/g) || []).length;

console.log('[pdf] ' + path.basename(outp) + '  ' + (bytes.length / 1024).toFixed(1) + ' KB' +
            '  pages=' + pages + '  ' + wpt + 'x' + hpt + 'pt (' + (land ? 'landscape' : 'portrait') + ')' +
            '  katexFontSubsets=' + fonts);

// Compare against the page count the paginator decided, not against 1: a multi-page sheet is
// normal now, and a hardcoded expectation would warn on every correct 2-page render.
let expect = null;
try {
  expect = JSON.parse(fs.readFileSync(path.join(env.WORK, 'pages.json'), 'utf8')).pages;
} catch (e) { /* no pagination pass: fall back to the single-page expectation */ }
if (expect) {
  if (pages !== String(expect)) console.error('  WARNING: expected ' + expect + ' page(s), got ' + pages);
} else if (pages !== '1') {
  console.error('  WARNING: expected exactly 1 page, got ' + pages);
}
if (!land) console.error('  WARNING: expected landscape A4 (842x595pt)');
if (fonts === 0) console.error('  WARNING: no embedded KaTeX font subsets - math may not print');
