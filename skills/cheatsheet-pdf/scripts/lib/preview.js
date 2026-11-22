// preview.js - rasterise one page of the built sheet to PNG, for a human to look at.
//
//   node preview.js <sheet.html> <out.png> [page]
//
// verify.js measures geometry; nothing in the pipeline shows a person what the page looks like, so
// every visual defect (a glyph the font lacked, a highlight that silently did nothing) was found by
// opening the PDF by hand. Hiding every page but the requested one makes page N screenshottable.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromePath, tempRoot, profile } = require('./env');

const [, , htmlPath, outPng, pageArg] = process.argv;
if (!htmlPath || !outPng) { console.error('preview: usage: node preview.js <sheet.html> <out.png> [page]'); process.exit(2); }
const page = Math.max(1, Number(pageArg) || 1);
const html = fs.readFileSync(htmlPath, 'utf8');

// Reuse diag.js's page-size discovery: the LAST .page block wins, because a --css overlay is
// appended to the stylesheet.
const mmToPx = (mm) => mm * 96 / 25.4;
const blocks = [...html.matchAll(/\.page\s*\{[^}]*width:\s*([\d.]+)mm[^}]*height:\s*([\d.]+)mm/g)];
const box = blocks.length ? blocks[blocks.length - 1] : null;
const pageW = box ? mmToPx(parseFloat(box[1])) : 1122.5;
const pageH = box ? mmToPx(parseFloat(box[2])) : 793.7;

const hide = '<style>body > .page:not(:nth-of-type(' + page + ')){display:none !important}' +
             'body{background:#fff}</style>';
// Temp files go to the OS temp dir, never next to the PDF: a preview must not leave a browser
// profile or a scratch HTML file in the user's working directory.
const scratch = path.join(tempRoot(), 'preview-html-' + process.pid);
fs.mkdirSync(scratch, { recursive: true });
const tmp = path.join(scratch, 'page' + page + '.html');
fs.writeFileSync(tmp, html.replace('</head>', hide + '</head>'), 'utf8');

const CHROME = chromePath();
const VIEW = ['--window-size=' + (Math.ceil(pageW) + 32) + ',' + (Math.ceil(pageH) + 118),
              '--force-device-scale-factor=1', '--hide-scrollbars'];
const base = ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-dev-shm-usage', '--disable-crash-reporter', '--disable-breakpad',
  '--user-data-dir=' + profile('preview')];
execFileSync(CHROME, base.concat(VIEW, ['--virtual-time-budget=3000',
  '--screenshot=' + path.resolve(outPng), 'file:///' + tmp.replace(/\\/g, '/')]),
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
console.log('preview: page ' + page + ' -> ' + outPng + '  (' + (fs.statSync(outPng).size / 1024).toFixed(0) + ' KB)');
