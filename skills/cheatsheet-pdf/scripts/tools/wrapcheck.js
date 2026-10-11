// wrapcheck.js - find every formula box whose math wrapped onto more than one line.
// A single KaTeX formula must stay on one line; if it cannot fit the column the right fix
// is to split it in the Markdown at a relational operator, or to shorten it - never to let
// the browser break it at an arbitrary point (which orphans fragments like "x)").
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { WORK, chromePath, profile } = require('../lib/env');
const dir = WORK;
const CHROME = chromePath();
const html = fs.readFileSync(path.join(dir, 'sheet.html'), 'utf8');
const script = `
<script>
window.addEventListener('load', function () {
  var f = document.querySelector('.flow');
  var boxes = f.querySelectorAll('.fxc, .fxd, .fxs');
  var out = [];
  var n = 0;
  for (var i = 0; i < boxes.length; i++) {
    var k = boxes[i].querySelector('.katex');
    if (!k) continue;
    var rects = k.getClientRects();
    if (rects.length > 1) {
      n++;
      var txt = (k.textContent || '').replace(/\\s+/g, ' ').trim();
      out.push('WRAP' + n + ' cls=' + boxes[i].className + ' lines=' + rects.length +
               ' colW=' + Math.round(boxes[i].getBoundingClientRect().width) +
               ' | ' + txt.slice(0, 120));
    }
  }
  if (!n) out.push('OK - no formula wrapped; every KaTeX formula occupies exactly one line');
  var d = document.createElement('div'); d.id = 'WRAP'; d.textContent = out.join(' ~~ ');
  document.body.appendChild(d);
});
</script>
</body>`;
fs.writeFileSync(path.join(dir, '_wrap.html'), html.replace('</body>', script), 'utf8');
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-dev-shm-usage', '--user-data-dir=' + profile('wrap'), '--disable-crash-reporter', '--disable-breakpad',
  '--window-size=1123,794', '--virtual-time-budget=3000', '--dump-dom',
  'file:///' + path.join(dir, '_wrap.html').replace(/\\/g, '/')],
  { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const m = /<div id="WRAP">([^<]*)<\/div>/.exec(dom);
if (!m) { console.log('WRAP_NOT_FOUND'); process.exit(1); }
console.log(m[1].split(' ~~ ').join('\n'));
