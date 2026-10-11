// last.js - verify the tail of the sheet: is the final text block inside its column?
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { WORK, chromePath, profile } = require('../lib/env');
const dir = WORK;
const CHROME = chromePath();
const html = fs.readFileSync(path.join(dir, 'sheet.html'), 'utf8');
const script = `
<script>
window.addEventListener('load', function () {
  var pg = document.querySelector('.page'), f = document.querySelector('.flow');
  var pcs = getComputedStyle(pg), fcs = getComputedStyle(f);
  var gap = parseFloat(fcs.columnGap) || 0;
  var padL = parseFloat(pcs.paddingLeft), padR = parseFloat(pcs.paddingRight);
  var inner = pg.clientWidth - padL - padR;
  var n = parseInt(fcs.columnCount, 10) || 5;
  var colW = (inner - gap * (n - 1)) / n;
  var pr = pg.getBoundingClientRect();
  var gridL = pr.left + padL;
  var out = [];
  var els = f.querySelectorAll('p, table, .q, .ul, .fxd, .fxc, .fxs, h1, h2, h3, blockquote');
  var list = [];
  for (var i = 0; i < els.length; i++) {
    var r = els[i].getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    list.push({ i: i, l: r.left - pr.left, r: r.right - pr.left, b: r.bottom - pr.top,
                t: r.top - pr.top, w: r.width, txt: (els[i].textContent || '').replace(/\\s+/g, ' ').slice(0, 40) });
  }
  list.sort(function (a, b) { return b.b - a.b; });
  out.push('pageH=' + pr.height.toFixed(0) + ' inner=' + inner.toFixed(0) + ' colW=' + colW.toFixed(1) + ' flowH=' + f.clientHeight);
  out.push('gridRight=' + (padL + inner).toFixed(1) + ' (page coords)');
  for (var k = 0; k < Math.min(8, list.length); k++) {
    var e = list[k];
    var ci = Math.floor((e.l - padL + 1) / (colW + gap));
    var colRight = padL + ci * (colW + gap) + colW;
    out.push('BOT#' + k + ' col=' + ci + ' bottom=' + e.b.toFixed(1) + ' rightEdge=' + e.r.toFixed(1) +
             ' colRight=' + colRight.toFixed(1) + (e.r > colRight + 0.6 ? ' *** OVERFLOWS COLUMN' : '') +
             ' | ' + e.txt);
  }
  var d = document.createElement('div'); d.id = 'LAST'; d.textContent = out.join(' || ');
  document.body.appendChild(d);
  // per-column check: the deepest block in every column, and any block crossing its right edge
  var worst = {}, bad = [];
  for (var q = 0; q < list.length; q++) {
    var e2 = list[q];
    var c2 = Math.floor((e2.l - padL + 1) / (colW + gap));
    if (!worst[c2] || e2.b > worst[c2].b) worst[c2] = e2;
    var cr = padL + c2 * (colW + gap) + colW;
    if (e2.r > cr + 0.6) bad.push('col' + c2 + ' right=' + e2.r.toFixed(1) + ' > ' + cr.toFixed(1) + ' | ' + e2.txt);
  }
  var o2 = ['PERCOL'];
  Object.keys(worst).sort(function (a, b) { return a - b; }).forEach(function (c) {
    var w2 = worst[c];
    o2.push('col' + c + ' deepestBottom=' + w2.b.toFixed(1) + ' right=' + w2.r.toFixed(1) + ' | ' + w2.txt);
  });
  o2.push(bad.length ? ('CROSSING(' + bad.length + '): ' + bad.slice(0, 6).join(' // ')) : 'CROSSING: none');
  var d2 = document.createElement('div'); d2.id = 'LAST2'; d2.textContent = o2.join(' || ');
  document.body.appendChild(d2);
});
</script>
</body>`;
fs.writeFileSync(path.join(dir, '_last.html'), html.replace('</body>', script), 'utf8');
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-dev-shm-usage', '--user-data-dir=' + profile('last'), '--disable-crash-reporter', '--disable-breakpad',
  '--window-size=1600,1131', '--virtual-time-budget=3000', '--dump-dom',
  'file:///' + path.join(dir, '_last.html').replace(/\\/g, '/')],
  { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const m = /<div id="LAST">([^<]*)<\/div>/.exec(dom);
console.log(m ? m[1].split(' || ').join('\n') : 'LAST_NOT_FOUND');
const m2 = /<div id="LAST2">([^<]*)<\/div>/.exec(dom);
console.log('---- per column ----');
console.log(m2 ? m2[1].split(' || ').join('\n') : 'LAST2_NOT_FOUND');
