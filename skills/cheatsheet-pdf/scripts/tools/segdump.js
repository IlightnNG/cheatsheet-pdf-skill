// segdump.js - inspect, in the real browser, which visual line each formula piece landed on.
//
//   node segdump.js "(MI)"
//
// Groups the .fxseg pieces of the matching box by their top coordinate, so it shows exactly
// where the browser chose to wrap - which is the only way to tell whether a trailing
// annotation rode along on the previous line or started a new one.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { WORK, chromePath, profile } = require('../lib/env');
const dir = WORK;
const CHROME = chromePath();
const needle = (process.argv[2] || '').replace(/\s+/g, '');
const html = fs.readFileSync(path.join(dir, 'sheet.html'), 'utf8');
const probe = `
<script>
window.addEventListener('load', function () {
  var f = document.querySelector('.flow');
  var boxes = f.querySelectorAll('.fxc, .fxd, .fxs');
  var out = [], shown = 0;
  for (var i = 0; i < boxes.length && shown < 3; i++) {
    var t = (boxes[i].textContent || '').replace(/\\s+/g, '');
    if (t.indexOf(${JSON.stringify(needle)}) < 0) continue;
    shown++;
    var segs = boxes[i].querySelectorAll('.fxseg');
    var lines = [], cur = null;
    for (var s = 0; s < segs.length; s++) {
      var r = segs[s].getBoundingClientRect();
      var top = Math.round(r.top);
      var txt = (segs[s].textContent || '').replace(/\\s+/g, '');
      var h = r.height;
      if (!cur || Math.abs(cur.top - top) > 3) { cur = { top: top, parts: [], maxH: 0 }; lines.push(cur); }
      cur.parts.push(txt);
      if (h > cur.maxH) cur.maxH = h;
    }
    out.push('BOX ' + boxes[i].className + '  segs=' + segs.length + '  visualLines=' + lines.length +
             '  boxW=' + Math.round(boxes[i].getBoundingClientRect().width));
    for (var L = 0; L < lines.length; L++) {
      out.push('  VIS-L' + (L + 1) + ' (h=' + lines[L].maxH.toFixed(1) + '): ' + lines[L].parts.join(' '));
    }
  }
  if (!shown) out.push('no box matched ' + ${JSON.stringify(needle)});
  var d = document.createElement('div'); d.id = 'SEG'; d.textContent = out.join(' ||| ');
  document.body.appendChild(d);
});
</script>
</body>`;
fs.writeFileSync(path.join(dir, '_seg.html'), html.replace('</body>', probe), 'utf8');
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-dev-shm-usage', '--user-data-dir=' + profile('seg'), '--disable-crash-reporter', '--disable-breakpad',
  '--window-size=1123,794', '--virtual-time-budget=3000', '--dump-dom',
  'file:///' + path.join(dir, '_seg.html').replace(/\\/g, '/')],
  { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const m = /<div id="SEG">([^<]*)<\/div>/.exec(dom);
console.log(m ? m[1].split(' ||| ').join('\n') : 'SEG_NOT_FOUND');
