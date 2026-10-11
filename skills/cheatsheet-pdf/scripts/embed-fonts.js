// embed-fonts.js - inline KaTeX's woff2 fonts into its CSS as data: URLs, so the sheet
// renders real math with no network and no file-path resolution problems.
//
//   node embed-fonts.js <katex-dist-dir> <out-css>
//
// Reads <dist>/katex.min.css and <dist>/fonts/*.woff2, writes a single self-contained CSS.
// Run once per KaTeX version; the output is reused by build.js.

const fs = require('fs');
const path = require('path');

const dist = process.argv[2];
const outCss = process.argv[3];
if (!dist || !outCss) {
  console.error('usage: node embed-fonts.js <katex-dist-dir> <out-css>');
  process.exit(1);
}

const fontsDir = path.join(dist, 'fonts');
let css = fs.readFileSync(path.join(dist, 'katex.min.css'), 'utf8');

// Collect the font files the CSS actually references.
const referenced = new Set();
for (const m of css.matchAll(/url\(\s*(?:'|")?([^'")]+?\.woff2)(?:'|")?\s*\)/g)) {
  referenced.add(path.basename(m[1]));
}

let embedded = 0, missing = [], bytes = 0;
for (const name of referenced) {
  const p = path.join(fontsDir, name);
  if (!fs.existsSync(p)) { missing.push(name); continue; }
  const b64 = fs.readFileSync(p).toString('base64');
  bytes += b64.length;
  // replace every reference to this file, whatever the relative path prefix was
  const re = new RegExp('url\\(\\s*[\'"]?[^\'")]*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\'"]?\\s*\\)', 'g');
  css = css.replace(re, 'url(data:font/woff2;base64,' + b64 + ')');
  embedded++;
}

// Drop the .woff / .ttf fallbacks entirely: Chrome always takes woff2, so these are
// dead weight AND would otherwise look like unresolved references.
css = css.replace(/,\s*url\([^)]*?\.woff\)\s*format\("woff"\)/g, '');
css = css.replace(/,\s*url\([^)]*?\.ttf\)\s*format\("truetype"\)/g, '');

// No stray references may remain, or the PDF would silently fall back to a wrong glyph set.
const leftover = [...css.matchAll(/url\(\s*['"]?([^'")]+\.(woff2|woff|ttf))\s*['"]?\)/g)].map(m => m[1]);

fs.writeFileSync(outCss, css, 'utf8');

console.log('embed-fonts: ' + embedded + ' woff2 inlined  (' + Math.round(bytes / 1024) + ' KB base64)');
if (missing.length) console.log('  MISSING files: ' + missing.join(', '));
if (leftover.length) {
  console.log('  WARNING - unresolved font URLs remain: ' + [...new Set(leftover)].join(', '));
} else {
  console.log('  OK - all font URLs resolved to data: URIs');
}
