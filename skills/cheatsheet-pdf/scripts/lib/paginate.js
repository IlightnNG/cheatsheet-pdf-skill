// paginate.js - decide the formula line breaks at build time instead of leaving them to
// the browser's greedy line filler. Run AFTER build.js and BEFORE fit-formulas.js:
//
//   node build.js && node paginate.js && node fit-formulas.js && node measure.js
//
// Why: two requirements cannot both be met by greedy inline wrapping.
//   (a) a trailing annotation such as \text{(MI)} or "for every e in (0,1)" should share
//       the previous line whenever it still fits;
//   (b) an independent formula must not be split - "H(X_1..X_n)" must not stay on a line
//       while its "= sum_i H(X_i|X^{i-1})" falls to the next one.
// Greedy filling satisfies (a) but breaks (b), because it happily starts a formula it
// cannot finish. So the lines are computed here with a first-fit over whole formulas, and
// only a formula too wide for a full line is allowed to break at its relations.
//
// The result is written back as explicit .fline blocks, so the printed layout no longer
// depends on the browser's wrapping decisions.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { WORK, ASSETS, chromePath, profile } = require('./env');
const dir = WORK;
const CHROME = chromePath();
const PROFILE = profile('paginate');
const NCOL = process.env.SHEET_COLS || null;

const sheetPath = path.join(dir, 'sheet.html');
const html = fs.readFileSync(sheetPath, 'utf8');
const ncol = NCOL || (/column-count:\s*(\d+)/.exec(html) || [, '5'])[1];

// Conservative mode: build.js already emitted one atomic segment per formula and left the
// wrapping to the browser, so there is nothing to paginate. Exiting here keeps the markup
// (and the reasoning about it) as simple as possible.
if (process.env.SHEET_NO_SPLIT === '1') {
  console.log('paginate: skipped (SHEET_NO_SPLIT=1 - conservative one-formula-per-line mode)');
  process.exit(0);
}

// ---------- pass 1: measure every segment ----------
const probe = html.replace('</body>', `<script>
window.addEventListener('load', function () {
  var pg = document.querySelector('.page'), f = document.querySelector('.flow');
  var pcs = getComputedStyle(pg), fcs = getComputedStyle(f);
  var usable = pg.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
  var gap = parseFloat(fcs.columnGap) || 0;
  var colW = (usable - gap * (${ncol} - 1)) / ${ncol};
  var out = ['COLW=' + colW];
  var boxes = f.querySelectorAll('.fxc, .fxd, .fxs');
  for (var b = 0; b < boxes.length; b++) {
    var segs = boxes[b].querySelectorAll('.fxseg');
    var row = [];
    for (var s = 0; s < segs.length; s++) {
      row.push(Math.round(segs[s].getBoundingClientRect().width * 100) / 100 + ':' +
               segs[s].getAttribute('data-g') + (segs[s].getAttribute('data-ann') ? 'a' : ''));
    }
    out.push(row.join(','));
  }
  var d = document.createElement('div'); d.id = 'PAG'; d.textContent = out.join('|');
  document.body.appendChild(d);
});
</script></body>`);
fs.writeFileSync(path.join(dir, '_pag.html'), probe, 'utf8');

let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--disable-dev-shm-usage', '--user-data-dir=' + PROFILE, '--disable-crash-reporter', '--disable-breakpad',
    '--window-size=1123,794', '--virtual-time-budget=3000', '--dump-dom',
    'file:///' + path.join(dir, '_pag.html').replace(/\\/g, '/')],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
} catch (e) {
  console.error('paginate: Chrome failed (set CHROME_PATH / CHROME_PROFILE).');
  process.exit(1);
}
const m = /<div id="PAG">([^<]*)<\/div>/.exec(dom);
if (!m) { console.error('paginate: measurement failed'); process.exit(1); }

const chunks = m[1].split('|');
const colW = parseFloat((/COLW=([\d.]+)/.exec(chunks[0]) || [, '214'])[1]);
const boxes = chunks.slice(1).map((row) => row ? row.split(',').map((tok) => {
  const [w, meta] = tok.split(':');
  return { w: parseFloat(w), g: parseInt(meta, 10), ann: /a$/.test(meta) };
}) : []);

// ---------- pass 2: first-fit line breaking ----------
let idCursor = 0;          // .fxseg ids were handed out in document order by build.js
const breaksAfter = new Set();   // segment id after which a new .fline starts
const firstIds = [];             // first .fxseg id of each box
const report = [];

for (const segs of boxes) {
  firstIds.push(idCursor);
  const firstId = idCursor;
  idCursor += segs.length;

  // group segments, then promote each group to a unit; a group too wide for a whole line
  // degrades to one unit per relation segment so it can still break sensibly
  const units = [];
  let i = 0;
  while (i < segs.length) {
    let j = i;
    while (j + 1 < segs.length && segs[j + 1].g === segs[i].g) j++;
    const grp = segs.slice(i, j + 1);
    const w = grp.reduce((a, s) => a + s.w, 0);
    if (grp[0].ann || grp.length === 1 || w <= colW) {
      units.push({ from: i, to: j, w: w });
    } else {
      for (let k = i; k <= j; k++) units.push({ from: k, to: k, w: segs[k].w });
    }
    i = j + 1;
  }

  let curW = 0, lines = 0;
  for (let u = 0; u < units.length; u++) {
    if (lines > 0 && curW + units[u].w > colW + 0.5) {
      breaksAfter.add(firstId + units[u].from - 1);   // start a new line before this unit
      curW = 0;
      lines++;
    } else if (lines === 0) {
      lines = 1;
    }
    curW += units[u].w;
  }
  report.push(segs.length + 'seg/' + lines + 'ln');
}

// ---------- pass 3: rewrite the boxes as explicit .fline blocks ----------
let out = html;
let boxNo = 0;
out = out.replace(/<div class="(fxc|fxd|fxs)">([\s\S]*?)<\/div>/g, (whole, cls, content) => {
  const segs = boxes[boxNo++];
  if (!segs || !segs.length) return whole;
  // split back into per-segment HTML; build.js joins them with "</span><wbr>"
  const parts = content.split('</span><wbr>');
  if (parts.length !== segs.length) return whole;      // unexpected shape: leave untouched
  const segHtml = parts.map((p, i) => (i < parts.length - 1 ? p + '</span>' : p));

  const baseId = firstIds[boxNo - 1];
  const lines = [[]];
  for (let i = 0; i < segHtml.length; i++) {
    const id = baseId + i;
    if (i > 0 && breaksAfter.has(id - 1)) lines.push([]);
    lines[lines.length - 1].push(segHtml[i]);
  }
  return '<div class="' + cls + '">' +
    lines.map((ln) => '<div class="fline">' + ln.join('') + '</div>').join('') + '</div>';
});

fs.writeFileSync(sheetPath, out, 'utf8');
console.log('paginate: column ' + colW.toFixed(1) + 'px, ' + boxes.length + ' boxes, ' +
            breaksAfter.size + ' line break(s)');
console.log('          ' + report.join(' '));
