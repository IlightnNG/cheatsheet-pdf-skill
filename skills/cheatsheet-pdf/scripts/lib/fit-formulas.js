// fit-formulas.js - shrink any KaTeX formula that is wider than its column, using a
// per-formula transform. Run AFTER build.js and BEFORE measure.js:
//
//   node build.js && node fit-formulas.js && node measure.js
//
// Why: a KaTeX formula is atomic (see the note in sheet.css), so one that is wider than
// a column would overflow and cascade the flow into extra columns. Scaling only the
// offenders keeps every other formula at full size. Anything that would need less than
// MIN_SCALE is reported so you can shorten it in the Markdown instead.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { WORK, ASSETS, chromePath, profile } = require('./env');
const dir = WORK;
const sheetPath = path.join(dir, 'sheet.html');
const CHROME = chromePath();
const PROFILE = profile('fit');
const MIN_SCALE = Number(process.env.MIN_SCALE || '0.72');

const original = fs.readFileSync(sheetPath, 'utf8');
// Read the column count from the BUILT sheet, not from sheet.css: build.js may override
// it (SHEET_COLS), and a stale count here would compute the wrong column width.
const NCOL = process.env.SHEET_COLS || (/column-count:\s*(\d+)/.exec(original) || [, '6'])[1];

// ---------- pass 1: measure ----------
const probe = original.replace('</body>', `<script>
window.addEventListener('load', function () {
  // Compute the column width from the PAGE, not from .flow: when the flow already
  // overflows, f.clientWidth is inflated and would understate how much to shrink.
  var pg = document.querySelector('.page');
  var f = document.querySelector('.flow');
  var pcs = getComputedStyle(pg);
  var usable = pg.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
  var cs = getComputedStyle(f);
  var gap = parseFloat(cs.columnGap) || 0;
  var colW = (usable - gap * (${NCOL} - 1)) / ${NCOL};
  var els = document.querySelectorAll('.fxseg .katex');
  var rows = [];
  for (var i = 0; i < els.length; i++) rows.push(Math.round(els[i].getBoundingClientRect().width * 100) / 100);
  var d = document.createElement('div'); d.id = 'KFIT';
  d.textContent = 'COLW=' + colW + '|' + rows.join(',');
  document.body.appendChild(d);
});
</script></body>`);

fs.writeFileSync(path.join(dir, '_kfit.html'), probe, 'utf8');
let dom;
try {
  dom = execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--disable-dev-shm-usage',
    '--user-data-dir=' + PROFILE, '--disable-crash-reporter', '--disable-breakpad',
    '--window-size=1600,1131', '--virtual-time-budget=3000',
    '--dump-dom', 'file:///' + path.join(dir, '_kfit.html').replace(/\\/g, '/')
  ], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
} catch (e) {
  console.error('fit-formulas: Chrome failed (set CHROME_PATH / CHROME_PROFILE).');
  process.exit(1);
}

const m = /<div id="KFIT">COLW=([\d.]+)\|([^<]*)<\/div>/.exec(dom);
if (!m) { console.error('fit-formulas: measurement failed'); process.exit(1); }
const colW = parseFloat(m[1]);
const widths = m[2].trim() ? m[2].split(',').map(Number) : [];

// ---------- pass 2: rewrite ----------
// Segments are addressed by the id build.js gives them, instead of trying to match a
// <div class="fxc">...</div> with a regex: the boxes now contain nested .fline divs, so a
// non-greedy div match would cut the structure in the wrong place and corrupt the sheet.
const shrunk = [], tooSmall = [];
let out = original;
widths.forEach((w, i) => {
  if (!w || w <= colW + 0.5) return;
  const scale = Math.max(colW / w, 0.01);
  if (scale < MIN_SCALE) tooSmall.push(Math.round(w));
  shrunk.push(Math.round(scale * 100) + '%');
  const key = 'id="s' + i + '"';
  const at = out.indexOf(key);
  if (at < 0) return;
  out = out.slice(0, at) + key + ' style="width:' + colW.toFixed(1) + 'px;overflow:hidden"' +
        out.slice(at + key.length);
  const kAt = out.indexOf('class="katex', at);
  if (kAt < 0) return;
  out = out.slice(0, kAt) +
        'style="transform:scale(' + scale.toFixed(4) + ');transform-origin:left center" ' +
        out.slice(kAt);
});

fs.writeFileSync(sheetPath, out, 'utf8');

// Leave a note for measure.js: knowing that formulas had to be scaled is what tells the capacity
// advice that the columns are already at their width limit, so "use a bigger font" is the wrong
// next move. Without this, the advice only looked at vertical capacity and sent one measured
// agent up a blind alley.
const scales = shrunk.map((s) => parseFloat(s) / 100);
fs.writeFileSync(path.join(dir, 'fit.json'), JSON.stringify({
  segments: widths.length,
  scaled: shrunk.length,
  minScale: scales.length ? Math.min.apply(null, scales) : 1
}, null, 2), 'utf8');

console.log('fit-formulas: column ' + colW.toFixed(1) + 'px, ' + widths.length + ' formula segments');
if (!shrunk.length) {
  console.log('  OK - every formula already fits its column');
} else {
  console.log('  scaled ' + shrunk.length + ': ' + shrunk.join(', '));
  if (tooSmall.length) {
    console.log('  WARNING - ' + tooSmall.length + ' formula(s) need < ' + Math.round(MIN_SCALE * 100) +
                '% (natural widths ' + tooSmall.join(', ') + 'px).');
    console.log('            Shorten those in the Markdown rather than scaling further.');
  }
}
