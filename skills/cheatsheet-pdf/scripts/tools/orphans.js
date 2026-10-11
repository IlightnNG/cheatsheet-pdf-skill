// orphans.js - find punctuation that starts a visual line of its own.
//
//   node orphans.js
//
// Checks EVERY punctuation character in the sheet, not just the last one of a paragraph:
// a "." or "," that directly follows an atomic inline (inline math, code) can be pushed
// onto the next line even in the middle of a sentence. For each such character the rect of
// the character itself is compared with the rect of the character before it; a different
// top means it was orphaned. Text-extraction heuristics are NOT reliable here - they report
// a lone "." even when it sits on the same visual line - so this is measured on geometry.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { WORK, chromePath, profile } = require('../lib/env');
const dir = WORK;
const CHROME = chromePath();
const html = fs.readFileSync(path.join(dir, 'sheet.html'), 'utf8');
const probe = `
<script>
window.addEventListener('load', function () {
  var f = document.querySelector('.flow');
  var out = [], n = 0, checked = 0;
  var NJ = '\\u2060';
  var walker = document.createTreeWalker(f, NodeFilter.SHOW_TEXT, null);
  var node;
  function topOf(range) { var r = range.getBoundingClientRect(); return r.width + r.height === 0 ? null : r.top; }
  function charTop(t, i) {
    if (i < 0 || i >= t.nodeValue.length) return null;
    var r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 1); return topOf(r);
  }
  // last ink before this text node, skipping the joiner
  function prevTop(t) {
    var s = t.nodeValue, i = 0;
    while (i < s.length && s[i] === NJ) i++;          // skip joiners at the head
    for (var k = i - 1; k >= 0; k--) { var v = charTop(t, k); if (v !== null) return v; }
    // step back through previous siblings
    var p = t.previousSibling;
    while (p) {
      if (p.nodeType === 3) { for (var j = p.nodeValue.length - 1; j >= 0; j--) { var v2 = charTop(p, j); if (v2 !== null) return v2; } }
      else if (p.nodeType === 1) {
        var tn = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null), last = null, x;
        while ((x = tn.nextNode())) if (x.nodeValue.trim()) last = x;
        if (last) { for (var m = last.nodeValue.length - 1; m >= 0; m--) { var v3 = charTop(last, m); if (v3 !== null) return v3; } }
      }
      p = p.previousSibling;
    }
    return null;
  }
  while ((node = walker.nextNode())) {
    var s = node.nodeValue;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if ('.,;:'.indexOf(c) < 0) continue;
      var mine = charTop(node, i);
      if (mine === null) continue;
      var before = (i > 0 && s[i - 1] !== NJ) ? charTop(node, i - 1) : prevTop(node);
      if (before === null) before = prevTop(node);
      if (before === null) continue;
      checked++;
      if (mine - before > 2) {
        n++;
        if (n <= 15) {
          var ctx = s.slice(Math.max(0, i - 30), i + 2);
          out.push('ORPHAN "' + c + '" after ...' + ctx.replace(/\\s+/g, ' ') + '  (y ' + before.toFixed(1) + ' -> ' + mine.toFixed(1) + ')');
        }
      }
    }
  }
  out.unshift('punctuation checked: ' + checked + '   orphaned: ' + n);
  if (!n) out.push('OK - no punctuation starts a visual line on its own');
  var d = document.createElement('div'); d.id = 'ORP'; d.textContent = out.join(' ||| ');
  document.body.appendChild(d);
});
</script>
</body>`;
fs.writeFileSync(path.join(dir, '_orp.html'), html.replace('</body>', probe), 'utf8');
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-dev-shm-usage', '--user-data-dir=' + profile('orp'), '--disable-crash-reporter', '--disable-breakpad',
  '--window-size=1123,794', '--virtual-time-budget=6000', '--dump-dom',
  'file:///' + path.join(dir, '_orp.html').replace(/\\/g, '/')],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const m = /<div id="ORP">([^<]*)<\/div>/.exec(dom);
console.log(m ? m[1].split(' ||| ').join('\n') : 'ORP_NOT_FOUND');
