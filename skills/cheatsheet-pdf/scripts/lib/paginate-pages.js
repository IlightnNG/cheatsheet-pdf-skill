// paginate-pages.js - distribute the sheet's blocks over N fixed-size pages.
//
//   node paginate-pages.js            (reads/writes SHEET_DIR/sheet.html)
//
// Runs AFTER fit-formulas.js (formulas must already fit the column width, or the measurement
// would see an unscaled formula occupying a whole column) and BEFORE measure.js.
//
// Why the split is computed here instead of by Chrome: printing a multicol container that is
// taller than one page relies on Chrome's page fragmentation, the least reliable part of its
// print path. Measured instead: N fixed-size .page blocks print as exactly N PDF pages, and a
// box whose content is taller than the box is CLIPPED (a 420mm child in a 204mm box still
// printed one page). So the page count is completely under our control - and the price is that
// overflow is silent, which is why this script measures every page and reports what does not
// fit rather than letting the printer cut it.
//
// Split rules (product decisions, see REFACTOR_PLAN.md Step 8):
//   1. never end a page on a heading (its content would start the next page alone);
//   2. prefer to start a page at a "# chapter" boundary, but only if that wastes no more than
//      SHEET_CHAP_WASTE of the page (default 0.12 columns-equivalent);
//   3. a single block taller than a page is an error naming that block - it cannot be split
//      here, and clipping it silently is the failure this script exists to prevent.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { WORK, chromePath, profile, fileUrl } = require('./env');

const dir = WORK;
const SHEET = path.join(dir, 'sheet.html');
const html = fs.readFileSync(SHEET, 'utf8');

const PAGES = Math.max(1, parseInt(process.env.SHEET_PAGES || '2', 10));
const CHAP_WASTE = Number(process.env.SHEET_CHAP_WASTE || '0.12');
const CHROME = chromePath();
const PROFILE = profile('pages');

// ---- pull the document apart on the markers build.js writes ------------------------------
const grab = (re, where) => {
  const m = re.exec(where);
  if (!m) {
    console.error('paginate-pages: marker ' + re.source + ' not found in sheet.html');
    process.exit(1);
  }
  return m[1];
};
const headEnd = html.indexOf('<body>');
if (headEnd < 0) { console.error('paginate-pages: no <body> in sheet.html'); process.exit(1); }
const head = html.slice(0, headEnd + '<body>'.length);
const page = grab(/<!--PAGE:BEGIN-->([\s\S]*?)<!--PAGE:END-->/, html);
const hdr = grab(/<!--HDR:BEGIN-->([\s\S]*?)<!--HDR:END-->/, page);
const leg = grab(/<!--LEG:BEGIN-->([\s\S]*?)<!--LEG:END-->/, page);
const flow = grab(/<!--FLOW:BEGIN-->([\s\S]*?)<!--FLOW:END-->/, page);

const MARK = '<!--B-->';
const blocks = flow.split(MARK).map((s) => s.trim()).filter(Boolean);
if (!blocks.length) { console.error('paginate-pages: no blocks (run md2body.js first)'); process.exit(1); }

// split() CONSUMES the marker, so every re-join has to put one back in front of every block -
// joining with the marker alone puts them only BETWEEN blocks and silently drops the marker of
// the first block on each page.
const joinBlocks = (arr) => arr.map((b) => MARK + b).join('\n');

const NCOL = Number((/column-count:\s*(\d+)/.exec(html) || [, '6'])[1]);

// page 1 carries the title, the right-hand note and the footer legend; later pages carry only
// the page number. The band is kept the same shape so the geometry stays comparable.
function pageHtml(idx, inner) {
  const h = idx === 1
    ? hdr
    : '<div class="hdr"><h1>&nbsp;</h1><div class="meta">' + idx + ' of ' + PAGES + '</div></div>';
  const l = idx === 1 ? leg : '';
  return '<div class="page" data-page="' + idx + '">' + h +
         '<div class="grid"><div class="flow">' + inner + '</div></div>' + l + '</div>';
}

// ---- one measurement pass: which blocks fit on this page, and how much room is left --------
const PROBE = (ncol) => `<script>
window.addEventListener('load', function () {
  var f = document.querySelector('.flow');
  var fr = f.getBoundingClientRect();
  var cs = getComputedStyle(f);
  var gap = parseFloat(cs.columnGap) || 0;
  var n = ${ncol};
  var colW = (f.clientWidth - gap * (n - 1)) / n;
  var ch = f.clientHeight || 1;
  var out = { cols: n, colW: colW, ch: ch, markers: 0, els: 0, blocks: [] };
  var nodes = f.childNodes, i, nd;
  // A block is everything between one marker and the next, not one element: md2body wraps a
  // formula line in <p>, build.js turns the $$ inside it into a block-level <div>, and the HTML
  // parser therefore CLOSES that <p> and emits <p></p><div class="fxd">…</div> - one markdown
  // block, several sibling elements (measured: 69 markers against 136 elements). Grouping them
  // and taking the union box is what makes the geometry correct.
  var cur = null, prio = 'p1', sec = '';
  var markers = 0, els = 0;
  for (i = 0; i < nodes.length; i++) {
    nd = nodes[i];
    if (nd.nodeType === 8) { if (nd.nodeValue === 'B') { markers++; cur = null; } continue; }
    if (nd.nodeType !== 1) continue;
    els++;
    if (!cur) {
      cur = { tag: nd.tagName, left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity,
              h: 0, prio: prio, sec: sec, text: '' };
      out.blocks.push(cur);
    }
    var r = nd.getBoundingClientRect();
    if (r.width > 0 || r.height > 0) {
      cur.left = Math.min(cur.left, r.left - fr.left);
      cur.right = Math.max(cur.right, r.right - fr.left);
      cur.top = Math.min(cur.top, r.top - fr.top);
      cur.bottom = Math.max(cur.bottom, r.bottom - fr.top);
      cur.h = cur.bottom - cur.top;
    }
    if (!cur.text) cur.text = (nd.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 64);
    // the section that owns the block is decided by the heading element that opens it
    if (nd.tagName === 'H2') {
      prio = (String(nd.className).match(/p[0-3]/) || ['p1'])[0];
      sec = (nd.textContent || '').replace(/^\\s+/, '').slice(0, 64);
      if (!cur.sec) cur.sec = sec;
      cur.prio = prio;
    }
    if (nd.tagName === 'H1') {
      sec = (nd.textContent || '').slice(0, 64);
      if (!cur.sec) cur.sec = sec;
    }
  }
  out.markers = markers;
  out.els = els;
  out.blocks = out.blocks.map(function (b) {
    var left = isFinite(b.left) ? b.left : 0;
    var ci = Math.round(left / (colW + gap));
    return { tag: b.tag, ci: ci, bottom: isFinite(b.bottom) ? b.bottom : 0, h: b.h,
             prio: b.prio, sec: b.sec, text: b.text };
  });
  var d = document.createElement('div');
  d.id = 'PAGES';
  d.textContent = JSON.stringify(out);
  document.body.appendChild(d);
});
</script>`;

function measure(idx, inner) {
  const probe = head + '\n' + pageHtml(idx, inner) + '\n' + PROBE(NCOL) + '\n</body></html>';
  const file = path.join(dir, '_pages.html');
  fs.writeFileSync(file, probe, 'utf8');
  const dom = execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--disable-dev-shm-usage',
    '--user-data-dir=' + PROFILE, '--disable-crash-reporter', '--disable-breakpad',
    '--window-size=1600,1131', '--virtual-time-budget=3000', '--dump-dom', fileUrl(file, true)
  ], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const m = /<div id="PAGES">([\s\S]*?)<\/div>/.exec(dom);
  if (!m) { console.error('paginate-pages: measurement failed'); process.exit(1); }
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
}

const heading = (b) => b && (b.tag === 'H1' || b.tag === 'H2' || b.tag === 'H3');
// "used" of a page whose last block is k-1, in column units. ch (the column height) is passed in:
// reading it off the blocks array silently produced bottom/1 and a nonsense 492-column overflow.
const usedAfter = (list, ch, k) => {
  if (k <= 0) return 0;
  const last = list[k - 1];
  return last.ci + last.bottom / (ch || 1);
};

const cuts = [];
let rest = blocks.slice();
let overflow = null;
const sections = new Map();      // priority+name -> total height, for the trim plan

for (let p = 1; p <= PAGES && rest.length; p++) {
  const mes = measure(p, joinBlocks(rest));
  if (mes.blocks.length !== rest.length) {
    console.error('paginate-pages: measured ' + mes.blocks.length + ' block(s) but ' + rest.length +
                  ' are in the flow - refusing to split on an incomplete measurement.');
    process.exit(1);
  }
  mes.blocks.forEach((b, i) => {
    if (!b) return;
    const key = b.prio + ' | ' + (b.sec || '(none)');
    sections.set(key, (sections.get(key) || 0) + b.h);
  });
  const ch = mes.ch, cols = mes.cols;

  // 1. the longest prefix that fits
  let fit = 0;
  while (fit < rest.length && mes.blocks[fit] &&
         mes.blocks[fit].ci <= cols - 1 && mes.blocks[fit].bottom <= ch + 1) fit++;

  if (fit === 0) {
    console.error('paginate-pages: the first block of page ' + p + ' does not fit a page at all.');
    console.error('  block: <' + mes.blocks[0].tag.toLowerCase() + '> "' + mes.blocks[0].text + '"');
    console.error('  Split that block (a long formula, or a wide table) - it cannot be moved.');
    process.exit(1);
  }

  const lastPage = (p === PAGES);
  if (fit === rest.length && !lastPage) { /* the page absorbed everything: nothing left */ }
  if (fit < rest.length && lastPage) {
    const full = usedAfter(mes.blocks, ch, fit);
    overflow = { page: p, needed: full, have: cols, over: full - cols, ch: ch };
  }

  // 2. never finish a page on a heading
  let cut = fit;
  while (cut > 0 && heading(mes.blocks[cut - 1])) cut--;

  // 3. start a page at a chapter boundary when that is cheap
  const usedFit = usedAfter(mes.blocks, ch, cut);
  if (cut < rest.length && !lastPage) {
    for (let j = cut; j > 0; j--) {
      if (mes.blocks[j].tag !== 'H1') continue;
      const usedChap = usedAfter(mes.blocks, ch, j);
      if (usedFit - usedChap <= CHAP_WASTE * cols) { cut = j; }
      break;
    }
  }
  if (cut === 0) cut = fit;      // a chapter cut of 0 would stall: fall back to the plain prefix

  cuts.push({ page: p, take: cut, used: usedAfter(mes.blocks, ch, cut), cols: cols, ch: ch });
  rest = rest.slice(cut);
}

// ---- assemble ---------------------------------------------------------------------------
const pages = [];
let at = 0;
for (let i = 0; i < cuts.length; i++) {
  const slice = blocks.slice(at, at + cuts[i].take);
  at += cuts[i].take;
  pages.push(pageHtml(i + 1, joinBlocks(slice)));
}
if (at < blocks.length) pages.push(pageHtml(cuts.length + 1, joinBlocks(blocks.slice(at))));
// The requested page count is a contract, not a maximum: when the content is shorter, the sheet
// still gets the pages the user asked for (a double-sided print needs both sides) and the spare
// pages are reported as thin rather than silently dropped.
while (pages.length < PAGES) pages.push(pageHtml(pages.length + 1, ''));

fs.writeFileSync(SHEET, head + '\n' + pages.join('\n') + '\n</body></html>\n', 'utf8');

// ---- reporting ---------------------------------------------------------------------------
// The trim plan is the point of this report: an over-long sheet is normally an over-long
// MARKDOWN, and the agent that wrote it can act on "cut 18mm from these ☆ sections" but not on
// "4.31 columns". Lowest priority first, then the tallest - see the compression order in
// SKILL.md. Heights are measured content height in that section's column.
const rank = (p) => ({ p0: 0, p1: 1, p2: 2, p3: 3 }[p] === undefined ? 9 : { p0: 0, p1: 1, p2: 2, p3: 3 }[p]);
const trim = [...sections.entries()]
  .map(([k, h]) => ({ key: k, prio: k.slice(0, 2), mm: h / 96 * 25.4 }))
  .sort((a, b) => (rank(a.prio) - rank(b.prio)) || (b.mm - a.mm));
fs.writeFileSync(path.join(dir, 'pages.json'), JSON.stringify({
  pages: pages.length, asked: PAGES, filled: cuts.length, cols: NCOL, cuts: cuts, overflow: overflow,
  sections: trim.slice(0, 20)
}, null, 2) + '\n', 'utf8');

console.log('paginate-pages: ' + pages.length + ' page(s) for a request of ' + PAGES + ', ' +
            blocks.length + ' block(s), ' + cuts.length + ' page(s) with content');
for (const c of cuts) {
  console.log('  page ' + c.page + ': ' + c.take + ' block(s), ' + c.used.toFixed(2) + ' of ' + c.cols +
              ' columns (' + Math.round(c.used / c.cols * 100) + '%)');
}
// "under" is advice for the authoring stage, exactly like the overflow case: the pages exist, but
// the last one is nearly empty, which almost always means more exam topics could be covered.
if (cuts.length < PAGES) {
  console.log('ADVICE: only ' + cuts.length + ' of ' + PAGES + ' page(s) have content - add topics');
  console.log('ADVICE: (every examined topic must appear) or lower --pages to ' + cuts.length + '.');
}

if (overflow) {
  const colMm = overflow.ch / 96 * 25.4;
  const needMm = Math.ceil((overflow.needed - overflow.have) * colMm);
  console.log('ADVICE: content does not fit ' + PAGES + ' page(s) - page ' + overflow.page +
              ' needs ' + overflow.needed.toFixed(2) + ' of ' + overflow.have + ' columns.');
  console.log('ADVICE: free about ' + needMm + 'mm of column height, lowest priority first:' +
              ' cut ☆ and ★ sections before ★★, and never a ★★★ formula.');
  for (const t of trim.slice(0, 5)) {
    if (rank(t.prio) === 3) break;
    console.log('ADVICE:   candidate ' + t.mm.toFixed(1) + 'mm  [' + t.prio + '] ' + t.key.slice(5));
  }
  console.log('ADVICE: cut order - prose restating a formula, then why-it-matters sentences, then a');
  console.log('ADVICE: second proof sentence, then off-syllabus enrichment. Or raise --pages.');
  process.exit(1);
}

for (const t of trim.slice(0, 3)) {
  console.log('  biggest section: ' + t.mm.toFixed(1) + 'mm  [' + t.prio + '] ' + t.key.slice(5));
}
