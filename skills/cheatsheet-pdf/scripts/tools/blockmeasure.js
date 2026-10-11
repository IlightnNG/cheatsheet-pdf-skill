// blockmeasure.js - disable multicol entirely and measure the real stacked height.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { WORK, chromePath, profile } = require('../lib/env');
const dir = WORK;
const CHROME = chromePath();
const html = fs.readFileSync(path.join(dir, 'sheet.html'), 'utf8');
const inject = `<style>
.flow { display: block !important; column-count: auto !important; column-width: auto !important; }
</style>`;
const probe = `
<script>
window.addEventListener('load', function () {
  var f = document.querySelector('.flow');
  var out = [];
  out.push('flowW=' + f.clientWidth + ' stackedH=' + f.scrollHeight);
  var kids = f.children, list = [];
  for (var i = 0; i < kids.length; i++) {
    var r = kids[i].getBoundingClientRect();
    list.push({ h: Math.round(r.height), w: Math.round(r.width), tag: kids[i].tagName,
      cls: (kids[i].className || '').toString().slice(0, 22),
      txt: (kids[i].textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 46) });
  }
  list.sort(function (a, b) { return b.h - a.h; });
  out.push('flow children=' + kids.length + '  totalH=' + list.reduce(function (a, b) { return a + b.h; }, 0));
  for (var k = 0; k < Math.min(8, list.length); k++) {
    out.push('  h=' + list[k].h + ' w=' + list[k].w + ' <' + list[k].tag + ' class="' + list[k].cls + '"> ' + list[k].txt);
  }
  var d = document.createElement('div'); d.id = 'BM'; d.textContent = out.join(' ||| ');
  document.body.appendChild(d);
});
</script>
</body>`;
fs.writeFileSync(path.join(dir, '_bm.html'), html.replace('</body>', inject + probe), 'utf8');
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-dev-shm-usage', '--user-data-dir=' + profile('bm'), '--disable-crash-reporter', '--disable-breakpad',
  '--window-size=1123,4000', '--virtual-time-budget=3000', '--dump-dom',
  'file:///' + path.join(dir, '_bm.html').replace(/\\/g, '/')],
  { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const m = /<div id="BM">([^<]*)<\/div>/.exec(dom);
console.log(m ? m[1].split(' ||| ').join('\n') : 'BM_NOT_FOUND');
