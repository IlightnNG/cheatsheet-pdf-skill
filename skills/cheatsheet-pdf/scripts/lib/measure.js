// measure.js - build a probe copy of sheet.html and report column usage.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { WORK, ASSETS } = require('./env');
const dir = WORK;
const html = fs.readFileSync(path.join(dir, 'sheet.html'), 'utf8');
// column count comes from the BUILT sheet, since build.js may override SHEET_COLS
const NCOL = (/column-count:\s*(\d+)/.exec(html) || [, '6'])[1];

const script = `
<script>
window.addEventListener('load', function () {
  var out = [];
  try {
    var f = document.querySelector('.flow');
    var fr = f.getBoundingClientRect();
    var cs = getComputedStyle(f);
    var gap = parseFloat(cs.columnGap) || 0;
    var n = __NCOL__;   // injected: Chrome reports 'auto' for computed column-count
    var colW = (f.clientWidth - gap * (n - 1)) / n;
    var maxX = 0;
    var pb = {};
    var els = f.querySelectorAll('p, table, .q, .ul, .fxd, .fxc, .fxs, h1, h2, h3');
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      var ci = Math.floor((r.right - fr.left + gap) / (colW + gap));
      if (ci > maxX) maxX = ci;
      var b = r.bottom - fr.top;
      if (!pb[ci] || b > pb[ci]) pb[ci] = b;
    }
    var ch = f.clientHeight || 1;
    out.push('COL=' + (maxX + 1));
    out.push('FILL=' + Math.round((pb[maxX] || 0) / ch * 100));
    out.push('COLW=' + (colW / 96 * 25.4).toFixed(1));
    out.push('OVER=' + (f.scrollWidth - f.clientWidth));
    out.push('COLSWITHCONTENT=' + (maxX + 1));
    out.push('AVAILH=' + (f.clientHeight / 96 * 25.4).toFixed(1));
  } catch (e) {
    out.push('ERR=' + e.message);
  }
  var d = document.createElement('div');
  d.id = 'DSHMEASURE';
  d.textContent = out.join(' ');
  document.body.appendChild(d);
});
</script>
</body>`;

fs.writeFileSync(path.join(dir, '_probe.html'), html.replace('</body>', script.replace('__NCOL__', NCOL)), 'utf8');

const { chromePath, profile, fileUrl } = require('./env');
const chrome = chromePath();
const PROFILE = profile('measure');
const dom = execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--disable-dev-shm-usage',
  '--user-data-dir=' + PROFILE, '--disable-crash-reporter', '--disable-breakpad',
  '--window-size=1600,1131', '--virtual-time-budget=2500',
  '--dump-dom', fileUrl(path.join(dir, '_probe.html'), true)
], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

const m = /<div id="DSHMEASURE">([^<]*)<\/div>/.exec(dom);
if (!m) { console.log('MEASURE_BLOCK_NOT_FOUND'); process.exit(1); }
console.log(m[1]);

// ---------------------------------------------------------------- capacity advice
// Searching the two dials by brute force is the biggest waste in a run: one measured agent burned
// 20 combinations because the starting guess was far off, and a later one needed 5 because the
// advice ignored the width side of the problem. The measurement already contains the answer.
//
//   used = (columns filled before the last) + (fraction of the last one that is filled)
//
// The two dials are not interchangeable:
//   --cols  changes the column WIDTH. For a formula-heavy sheet the height is set by the number of
//           formula lines, which does not change with width, so fill' = used/cols' - i.e. widening
//           the columns is an EXACT way to fill the page. For prose the line count grows as the
//           columns narrow, which cancels out, so it does nothing.
//   --base  always works, but it also widens every formula, so at some point the columns hit
//           their width limit and fit-formulas.js has to scale formulas down.
const fields = {};
m[1].trim().split(/\s+/).forEach((kv) => { const i = kv.indexOf('='); fields[kv.slice(0, i)] = kv.slice(i + 1); });
const cols = parseInt(NCOL, 10);
const col = parseInt(fields.COL, 10);
const fill = parseInt(fields.FILL, 10);
const over = parseInt(fields.OVER, 10);
const basePt = parseFloat(((/\.page\s*\{[^}]*font-size:\s*([\d.]+)pt/.exec(html)) || [, '0'])[1]);
const used = (col - 1) + fill / 100;
let fit = null;
try { fit = JSON.parse(fs.readFileSync(path.join(dir, 'fit.json'), 'utf8')); } catch (e) { /* not built yet */ }

// Multi-page sheets need different advice. The column/type advice below only makes sense when a
// single page must absorb everything: once the page count is fixed by the user, raising --cols or
// --base does not "fill the page", it pushes content onto another page. The levers there are the
// CONTENT (module A: add topics, or cut the lowest-priority ones) and the requested page count.
let pgm = null;
try { pgm = JSON.parse(fs.readFileSync(path.join(dir, 'pages.json'), 'utf8')); } catch (e) { /* not paginated */ }
if (pgm && pgm.pages > 1) {
  const filled = (pgm.cuts || []).length;
  const last = filled ? pgm.cuts[filled - 1] : null;
  const lastRatio = last ? last.used / last.cols : 0;
  console.log('ADVICE: ' + pgm.pages + ' page(s) requested, ' + filled + ' with content: ' +
              (pgm.cuts || []).map((c) => 'p' + c.page + ' ' + Math.round(c.used / c.cols * 100) + '%').join(', '));
  if (filled < pgm.pages || lastRatio < 0.35) {
    console.log('ADVICE: the sheet is under its page budget - add topics (every examined topic must');
    console.log('ADVICE: appear), or lower --pages to ' + Math.max(1, filled) + '. Do not inflate --base: that only');
    console.log('ADVICE: pushes content onto another page.');
  } else if (lastRatio < 0.75) {
    console.log('ADVICE: the last page is ' + Math.round(lastRatio * 100) + '% full - fine, and more topics would');
    console.log('ADVICE: use it better.');
  } else {
    console.log('ADVICE: every page is well filled - good fit for ' + pgm.pages + ' page(s).');
  }
} else if (col > cols + 1) {
  console.log('ADVICE: content needs far more columns than declared (' + col + ' vs ' + cols + '). ' +
              'Lower --base substantially (roughly half) or cut content - do not follow this by ' +
              'setting --cols=' + col + '.');
} else if (col === cols + 1) {
  console.log('ADVICE: content needs exactly one more column -> --cols=' + col + '.');
} else if (over > 0) {
  console.log('ADVICE: a block is wider than its column (OVER=' + over + 'px) even after fitting. ' +
              'Shorten that formula in the Markdown.');
} else if (used < cols - 0.25) {
  // Threshold: a last column filled to about three quarters is good enough, so anything below
  // that is worth one more pass. A looser half-column threshold reported "good fit" for a sheet
  // whose last column was only 58% full.
  // Widening the columns does not change how many lines a formula-heavy sheet needs, so the fill
  // becomes used/cols'. The best integer choice is therefore the smallest cols' that still fits:
  // ceil(used/0.95). For prose this does nothing (narrower columns reflow into more lines), so it
  // is offered with that caveat, while --base always works but widens every formula.
  const bestCols = Math.max(1, Math.ceil(used / 0.95));
  const bestFill = Math.round(used / bestCols * 100);
  const want = Math.sqrt(0.95 * cols / used);          // conservative (prose-like) estimate
  const capped = Math.min(want, 1.25);
  const options = [];
  // Only offer a column change that would actually change something.
  if (bestCols < cols) {
    options.push('--cols=' + bestCols + ' -> about ' + bestFill + '% (exact for a formula-heavy ' +
                 'sheet, no side effects)');
  }
  options.push('--base=' + (basePt ? (Math.round(basePt * capped * 10) / 10) : 'higher') +
               ' (always works, but widens formulas)');
  console.log('ADVICE: content fills only ' + used.toFixed(2) + ' of ' + cols + ' columns - sparse. ' +
              'Fill it with ' + options.join(', or ').replace(/, or (--base)/, ' or $1') + '.');
  if (bestFill < 60) {
    console.log('ADVICE: even the widest sensible columns leave the page mostly empty, so the ' +
                'content is thin for one page - adding material is the real fix. Type alone would ' +
                'need about ' + (Math.round(basePt * want * 10) / 10) + 'pt.');
  }
  if (fit && fit.scaled > 0) {
    console.log('ADVICE: ' + fit.scaled + ' formula(s) were already scaled to fit their column ' +
                '(down to ' + Math.round(fit.minScale * 100) + '%), so prefer --cols over --base.');
  }
} else {
  console.log('ADVICE: content fills ' + used.toFixed(2) + ' of ' + cols + ' columns - good fit.');
}
