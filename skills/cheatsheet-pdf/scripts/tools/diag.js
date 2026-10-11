// diag.js - ground-truth geometry of the built sheet, plus a PNG screenshot.
//
//   node diag.js <out.png>
//
// measure.js derives the column width from .flow.clientWidth, which is not reliable;
// here the width is taken from the block elements that actually fill a column, so the
// column count and the fill percentage are trustworthy.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { WORK, chromePath, profile } = require('../lib/env');
const dir = WORK;
const CHROME = chromePath();
const PROFILE = profile('diag');
const png = process.argv[2] || path.join(dir, '_diag.png');

const html = fs.readFileSync(path.join(dir, 'sheet.html'), 'utf8');
const script = `
<script>
window.addEventListener('load', function () {
  var out = [];
  var pg = document.querySelector('.page'), f = document.querySelector('.flow');
  var pcs = getComputedStyle(pg), fcs = getComputedStyle(f);
  var gap = parseFloat(fcs.columnGap) || 0;
  var inner = pg.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
  out.push('pageInner=' + inner.toFixed(1));
  // Header band height. The band must stay ONE line (title + right-hand note): a long subtitle
  // or a long title squeezes the note into wrapping and the band grows, which is column height
  // lost from every column. Measured on a real sheet: a 9-item topic list cost 5.3mm.
  var hdr = document.querySelector('.hdr');
  out.push('hdrH=' + (hdr ? (hdr.getBoundingClientRect().height / 96 * 25.4).toFixed(2) : '0'));
  out.push('flowClient=' + f.clientWidth.toFixed(1));
  out.push('flowScroll=' + f.scrollWidth.toFixed(1));
  out.push('declaredCols=' + fcs.columnCount);
  // column pitch measured from the blocks that occupy a column
  var fr = f.getBoundingClientRect();
  var xs = {}, tallest = 0;
  var els = f.querySelectorAll('p, table, .q, .ul, .fxd, .fxc, .fxs, h1, h2, h3, blockquote');
  for (var i = 0; i < els.length; i++) {
    var r = els[i].getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    var k = Math.round((r.left - fr.left) / 10) * 10;
    if (!xs[k] || r.width > xs[k]) xs[k] = r.width;
    var b = r.bottom - fr.top;
    if (b > tallest) tallest = b;
  }
  var keys = Object.keys(xs).map(Number).sort(function (a, b) { return a - b; });
  var widths = keys.map(function (k) { return Math.round(xs[k]); });
  out.push('colLefts=' + keys.length);
  out.push('maxBlockW=' + Math.max.apply(null, widths.concat([0])));
  out.push('headerPitch=' + (keys.length > 1 ? (keys[1] - keys[0]) : 0));
  // tallest column, NOT the last one: this is the overflow check (must stay <= 100%). How full
  // the page actually is comes from measure.js's FILL, which reports the LAST column.
  out.push('fillPct=' + Math.round(tallest / (f.clientHeight || 1) * 100));
  out.push('flowH=' + f.clientHeight.toFixed(1));
  var d = document.createElement('div'); d.id = 'DIAG'; d.textContent = out.join(' ');
  document.body.appendChild(d);
});
</script>
</body>`;

fs.writeFileSync(path.join(dir, '_diag.html'), html.replace('</body>', script), 'utf8');
const base = ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--disable-dev-shm-usage',
  '--user-data-dir=' + PROFILE, '--disable-crash-reporter', '--disable-breakpad'];
// The page is 297x210mm = 1122.5x793.7 CSS px. Chrome's viewport is smaller than --window-size
// by fixed insets (measured: -16 px width, -94 px height), so the obvious 1123x794 window
// captured only 710 px of height and cropped the bottom 10% of every screenshot. Size the
// window from the page geometry so a portrait sheet (or any edited page size) is captured too.
const mmToPx = (mm) => mm * 96 / 25.4;
// Take the LAST .page block: a --css overlay is appended to the stylesheet, so its size wins.
// Reading the first block would size the window for the wrong paper (observed: a portrait sheet
// previewed at landscape dimensions).
const pageBlocks = [...html.matchAll(/\.page\s*\{[^}]*width:\s*([\d.]+)mm[^}]*height:\s*([\d.]+)mm/g)];
const box = pageBlocks.length ? pageBlocks[pageBlocks.length - 1] : null;
const pageW = box ? mmToPx(parseFloat(box[1])) : 1122.5;
const pageH = box ? mmToPx(parseFloat(box[2])) : 793.7;
const VIEW = ['--window-size=' + (Math.ceil(pageW) + 32) + ',' + (Math.ceil(pageH) + 118),
              '--force-device-scale-factor=1', '--hide-scrollbars'];
const url = 'file:///' + path.join(dir, '_diag.html').replace(/\\/g, '/');

const dom = execFileSync(CHROME, base.concat(VIEW, ['--virtual-time-budget=3000', '--dump-dom', url]),
  { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const m = /<div id="DIAG">([^<]*)<\/div>/.exec(dom);
console.log(m ? m[1] : 'DIAG_NOT_FOUND');

execFileSync(CHROME, base.concat(VIEW, ['--virtual-time-budget=3000',
  '--screenshot=' + png, 'file:///' + path.join(dir, 'sheet.html').replace(/\\/g, '/')]),
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
console.log('screenshot -> ' + png + '  (' + (fs.statSync(png).size / 1024).toFixed(0) + ' KB)');
