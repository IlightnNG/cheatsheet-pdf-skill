// md2body.js - convert the prioritised markdown into the sheet's HTML body.
// Handles headings, bullets, blockquotes, tables, and preserved math delimiters.
const fs = require('fs');
const path = require('path');

const { WORK, ASSETS } = require('./env');
const dir = WORK;
const SRC = process.argv[2];
if (!SRC) {
  console.error('md2body: pass the Markdown master, e.g.  node md2body.js sheet.md');
  process.exit(2);
}
const OUT = path.join(dir, 'body.html');

let md = fs.readFileSync(SRC, 'utf8');

// ---- page header metadata -------------------------------------------------------------
// The first "# Title" becomes the printed header, and the blockquote that OPENS the document
// may carry the rest of its identity:
//   > **Meta:** <the short right-hand note, e.g. "log = ln, angles in radians">
//   > **Footer:** <the line printed under the columns>
//   > **Header:** <optional subtitle after the title - 2-4 words only; a long one wraps the
//                   right-hand note into extra lines and costs column height>
// Env vars win over the Markdown, and values are emitted verbatim, so HTML entities such as
// &#8322; may be used.
const titleMatch = /^#[^\n]*\n/.exec(md);
const docTitle = titleMatch ? titleMatch[0].replace(/^#\s*/, '').trim() : '';

// The front matter is the blockquote that OPENS the document - and only that one. Anchoring at
// the start of the string (no /m flag) is the point: with /m this pattern also matched the first
// blockquote ANYWHERE in the file, so a sheet written without front matter silently lost its
// first "> **Trap.**" box to the metadata parser.
const afterTitle = md.replace(/^#[^\n]*\n/, '');
const fm = /^(?:[ \t]*\r?\n)*(?:>[^\n]*\r?\n?)+/.exec(afterTitle);
const quoteText = fm ? fm[0] : '';
const pick = (label) => {
  const m = new RegExp('^>\\s*\\*\\*' + label + ':?\\*\\*\\s*(.+)$', 'mi').exec(quoteText);
  return m ? m[1].trim() : '';
};
const meta = {
  title: process.env.SHEET_TITLE || docTitle || 'CHEAT SHEET',
  subtitle: process.env.SHEET_SUBTITLE || pick('Header') || '',
  meta: process.env.SHEET_META || pick('Meta') || '',
  footer: process.env.SHEET_FOOTER || pick('Footer') || ''
};

// Warnings collected while converting. Printed once at the end, so a silent default - a section
// with no star run, a dropped authoring-aid section - cannot pass unnoticed.
const notes = [];

// ---- drop the front matter and any section that is not sheet content ----
md = afterTitle.slice(quoteText.length);
// A section that records the authoring process instead of the subject is not sheet content. It is
// announced rather than dropped in silence, so it cannot look like content loss.
const aid = /##\s*Rating overview[\s\S]*?(?=\n#\s|$)/.exec(md);
if (aid) {
  md = md.replace(aid[0], '');
  notes.push('dropped "## Rating overview" - it records the authoring process, not the subject');
}

// ---- inline markdown, applied ONLY outside math ----
function mdInline(s) {
  return s
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<b>$1</b>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// Math runs must pass through VERBATIM. Superscript stars are everywhere in this sheet
// (A^*, \epsilon^*, \beta^*_n, D^*_s), and formatting the whole line turned each pair of
// them into <i>...</i>: A^* came out as A^<i>, which both printed wrong and made KaTeX
// fail on the stray angle brackets.
const MATH_RE = /\$\$[!?]?[\s\S]*?\$\$|\$[^$\n]*?\$/g;

function inline(s) {
  let res = '', last = 0, m;
  MATH_RE.lastIndex = 0;
  while ((m = MATH_RE.exec(s)) !== null) {
    if (m.index > last) res += mdInline(s.slice(last, m.index));
    res += m[0];
    last = m.index + m[0].length;
  }
  return res + mdInline(s.slice(last));
}

const lines = md.split(/\r?\n/);
// Every top-level block is preceded by this marker. paginate-pages.js splits the body on it to
// distribute blocks over pages: a table, a trap box or a list spans several LINES, so a newline
// is not a block boundary, and matching </div> with a regex is precisely the bug that
// fit-formulas.js documents. A comment costs nothing in layout and makes the boundary explicit.
const B = '<!--B-->';
const out = [];
let inTable = false;
let inQuote = false;
let inList = false;

const closeList = () => { if (inList) { out.push('</div>'); inList = false; } };
const closeQuote = () => { if (inQuote) { out.push('</div>'); inQuote = false; } };
const closeTable = () => { if (inTable) { out.push('</table>'); inTable = false; } };

// a star run at the start of a heading maps to a priority class
function prioClass(text) {
  if (/★★★/.test(text)) return 'p3';
  if (/★★/.test(text)) return 'p2';
  if (/☆/.test(text)) return 'p0';
  if (/★/.test(text)) return 'p1';
  return 'p1';
}

// strip the star run from the visible heading text
function cleanHead(text) {
  return text.replace(/^[★☆\s]+/, '').trim();
}

for (let raw of lines) {
  const line = raw.replace(/\s+$/, '');

  if (!line.trim()) {
    closeTable();
    continue;
  }

  // horizontal rule -> ignore (section separators are dropped)
  if (/^---+$/.test(line.trim())) { closeTable(); closeQuote(); closeList(); continue; }

  // headings
  let m;
  if ((m = /^#\s+(.*)$/.exec(line))) {
    closeTable(); closeQuote(); closeList();
    out.push(B + '<h1>' + inline(cleanHead(m[1])) + '</h1>');
    continue;
  }
  if ((m = /^##\s+(.*)$/.exec(line))) {
    closeTable(); closeQuote(); closeList();
    const t = m[1];
    // A section with no star run used to fall through to p1 (grey "in scope") in silence; the
    // star run IS the priority signal, so say so when it is missing.
    if (!/[★☆]/.test(t)) {
      notes.push('section without a star run, so it prints as p1 (grey "in scope"): "' +
                 cleanHead(t).slice(0, 48) + '"');
    }
    out.push(B + '<h2 class="' + prioClass(t) + '">' + inline(cleanHead(t)) + '</h2>');
    continue;
  }
  if ((m = /^###\s+(.*)$/.exec(line))) {
    closeTable(); closeQuote(); closeList();
    out.push(B + '<h3>' + inline(cleanHead(m[1])) + '</h3>');
    continue;
  }

  // blockquote -> keep, converting **bold** inside
  if ((m = /^>\s?(.*)$/.exec(line))) {
    closeTable(); closeList();
    let body = m[1];
    if (!inQuote) { out.push(B + '<div class="q">'); inQuote = true; }
    if (body.trim()) out.push('<p>' + inline(body) + '</p>');
    continue;
  } else {
    closeQuote();
  }

  // table
  if (/^\|/.test(line)) {
    const cells = line.split('|').slice(1, -1).map(s => s.trim());
    if (/^\|[\s:\-|]+\|$/.test(line)) continue;             // separator row
    closeList();
    if (!inTable) { out.push(B + '<table>'); inTable = true; }
    const tag = out[out.length - 1] === B + '<table>' ? 'th' : 'td';
    out.push('<tr>' + cells.map(c => '<' + tag + '>' + inline(c) + '</' + tag + '>').join('') + '</tr>');
    continue;
  } else {
    closeTable();
  }

  // bullet list
  if ((m = /^[-*]\s+(.*)$/.exec(line))) {
    if (!inList) { out.push(B + '<div class="ul">'); inList = true; }
    out.push('<div class="li">' + inline(m[1]) + '</div>');
    continue;
  } else {
    closeList();
  }

  // numbered list
  if ((m = /^\d+\.\s+(.*)$/.exec(line))) {
    if (!inList) { out.push(B + '<div class="ul ol">'); inList = true; }
    out.push('<div class="li">' + inline(m[1]) + '</div>');
    continue;
  } else {
    closeList();
  }

  // plain paragraph (display math lines start with $$ and are kept verbatim)
  out.push(B + '<p>' + inline(line) + '</p>');
}
closeTable(); closeQuote(); closeList();

fs.writeFileSync(OUT, '<!-- BODY:BEGIN -->\n' + out.join('\n') + '\n<!-- BODY:END -->\n', 'utf8');
fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
console.log('md2body: ' + path.basename(SRC) + ' -> body.html  (' + out.length + ' blocks)');
// Label this "title" (it printed the title as "header" before, which reads as though the optional
// subtitle line were present even when it is not) and show the subtitle only when there is one.
console.log('         title: "' + meta.title + '"' +
            (meta.subtitle ? '  |  sub: "' + meta.subtitle + '"' : '') +
            (meta.meta ? '  |  meta: "' + meta.meta + '"' : ''));
for (const n of notes) console.log('         note: ' + n);
