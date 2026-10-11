// sizes.js - report the EFFECTIVE math font size in each context, from the laid-out page.
// This is the check that matters: the bug was a box's own font-size multiplying the math
// size, so the grey supporting box ended up with smaller math than inline prose math.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { WORK, chromePath, profile } = require('../lib/env');
const dir = WORK;
const CHROME = chromePath();
const html = fs.readFileSync(path.join(dir, 'sheet.html'), 'utf8');
const script = `
<script>
window.addEventListener('load', function () {
  var f = document.querySelector('.flow');
  var px2pt = 72 / 96;
  function probe(sel, label) {
    var el = f.querySelector(sel);
    if (!el) return label + ': none';
    var cs = getComputedStyle(el);
    var fpx = parseFloat(cs.fontSize);
    var box = el.closest('.fxc, .fxd, .fxs');
    var bpx = box ? parseFloat(getComputedStyle(box).fontSize) : null;
    var n = f.querySelectorAll(sel).length;
    return label + ': math=' + (fpx * px2pt).toFixed(2) + 'pt (' + fpx.toFixed(2) + 'px)' +
           (bpx ? '  box=' + (bpx * px2pt).toFixed(2) + 'pt  effective=' + (fpx).toFixed(2) + 'px' : '') +
           '   count=' + n;
  }
  var out = [];
  var pagePx = parseFloat(getComputedStyle(document.querySelector('.page')).fontSize);
  out.push('base page font = ' + (pagePx * px2pt).toFixed(2) + 'pt');
  out.push(probe('.fxc .katex', 'pink  $$!'));
  out.push(probe('.fxd .katex', 'blue  $$ '));
  out.push(probe('.fxs .katex', 'grey  $$?'));
  // Inline math is styled by ONE rule covering p / li / td / th / blockquote, so the reference
  // probe has to cover the same contexts. Probing only "p .katex" made a sheet whose inline math
  // sits in list items or table cells report n/a, and the hierarchy gate then passed vacuously.
  var INLINE = 'p .katex, .li .katex, td .katex, th .katex, blockquote .katex';
  out.push(probe(INLINE, 'inline $ '));
  // Ratio to INLINE math in prose. That is the reference the hierarchy is about - NOT the body
  // text size, which is larger (math in a box is deliberately allowed to sit below the running
  // text so the boxes stay compact). Calling this "prose" invited reading it as the text size.
  // A sheet need not use all three box types, so an absent context reports n/a rather than 0 -
  // "0.000x" would look like a real (and failing) measurement.
  function sizeOf(sel) { var e = f.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; }
  var prose = sizeOf(INLINE);
  ['fxc', 'fxd', 'fxs'].forEach(function (c) {
    var s = sizeOf('.' + c + ' .katex');
    out.push(c + ' / inline = ' + (s && prose ? (s / prose).toFixed(3) + 'x' : 'n/a'));
  });
  var d = document.createElement('div'); d.id = 'SZ'; d.textContent = out.join(' || ');
  document.body.appendChild(d);
});
</script>
</body>`;
fs.writeFileSync(path.join(dir, '_sz.html'), html.replace('</body>', script), 'utf8');
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-dev-shm-usage', '--user-data-dir=' + profile('sz'), '--disable-crash-reporter', '--disable-breakpad',
  '--window-size=1123,794', '--virtual-time-budget=3000', '--dump-dom',
  'file:///' + path.join(dir, '_sz.html').replace(/\\/g, '/')],
  { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const m = /<div id="SZ">([^<]*)<\/div>/.exec(dom);
console.log(m ? m[1].split(' || ').join('\n') : 'SZ_NOT_FOUND');
