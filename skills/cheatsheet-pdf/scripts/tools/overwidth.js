// overwidth.js - is any page's multicol flow wider than its declared column area?
//
//   node overwidth.js            (reads <SHEET_DIR>/sheet.html)
//
// This is the defect that a height-based model cannot see: paginate-pages.js computes how many
// columns a page needs from block heights, but Chrome re-lays the SAME blocks once they sit in the
// real page, and a block can then spill into an extra column that the page box clips. The visible
// symptom on a printed sheet was two word fragments ("plus", "equ") at the top-right corner.
//
// Prints one line per offending page:  OVERWIDTH page=<n> over=<px> cols=<declared>
// Exit 1 when any page is over, 0 when every page fits, 2 on a usage/geometry error.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { WORK, chromePath, profile } = require('../lib/env');

const dir = WORK;
const sheet = path.join(dir, 'sheet.html');
if (!fs.existsSync(sheet)) { console.error('overwidth: ' + sheet + ' not found'); process.exit(2); }

const html = fs.readFileSync(sheet, 'utf8');
const probe = `
<script>
window.addEventListener('load', function () {
  var out = [];
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    var f = pages[i].querySelector('.flow');
    if (!f) continue;
    var over = f.scrollWidth - f.clientWidth;
    var cols = parseInt(getComputedStyle(f).columnCount, 10) || 0;
    if (over > 1) out.push('OVERWIDTH page=' + (i + 1) + ' over=' + over.toFixed(1) + ' cols=' + cols);
  }
  var d = document.createElement('div');
  d.id = 'OW';
  d.textContent = out.length ? out.join(' | ') : 'OK';
  document.body.appendChild(d);
});
</script>
</body>`;
fs.writeFileSync(path.join(dir, '_ow.html'), html.replace('</body>', probe), 'utf8');

const CHROME = chromePath();
const mmToPx = (mm) => mm * 96 / 25.4;
const blocks = [...html.matchAll(/\.page\s*\{[^}]*width:\s*([\d.]+)mm[^}]*height:\s*([\d.]+)mm/g)];
const box = blocks.length ? blocks[blocks.length - 1] : null;
const W = box ? mmToPx(parseFloat(box[1])) : 1122.5;
const H = box ? mmToPx(parseFloat(box[2])) : 793.7;
const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-dev-shm-usage', '--disable-crash-reporter', '--disable-breakpad',
  '--user-data-dir=' + profile('ow'),
  '--window-size=' + (Math.ceil(W) + 32) + ',' + (Math.ceil(H) + 118),
  '--force-device-scale-factor=1', '--hide-scrollbars',
  '--virtual-time-budget=3000', '--dump-dom',
  'file:///' + path.join(dir, '_ow.html').replace(/\\/g, '/')];

const dom = execFileSync(CHROME, args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const m = /<div id="OW">([^<]*)<\/div>/.exec(dom);
if (!m) { console.error('overwidth: measurement failed'); process.exit(2); }
if (m[1] === 'OK') { console.log('overwidth: every page fits its columns'); process.exit(0); }
for (const line of m[1].split(' | ')) console.log(line);
process.exit(1);
