// build.js - assemble sheet.html with REAL math typesetting.
//
//   node build.js
//
// Reads   <SHEET_DIR>/body.html  +  <scripts>/sheet.css  +  <scripts>/vendor/*
// Writes  <SHEET_DIR>/sheet.html
//
// Math is rendered server-side by KaTeX (vendored in scripts/vendor), so the page needs
// no network and no browser-side JavaScript. KaTeX's fonts are inlined as data: URIs
// in vendor/katex-fonts.css, so glyphs are embedded in the printed PDF.
//
// Markdown maths mapping:
//   $$!...$$   core result   -> .fxc  (pink, red bar)
//   $$...$$    standard      -> .fxd  (blue, navy bar)
//   $$?...$$   supporting    -> .fxs  (grey)
//   $...$      inline

const fs = require('fs');
const path = require('path');

const { WORK, ASSETS } = require('./env');
const dir = WORK;
const katex = require(path.join(ASSETS, 'vendor', 'katex.min.js'));
let css = fs.readFileSync(path.join(ASSETS, 'sheet.css'), 'utf8');
const katexCss = fs.readFileSync(path.join(ASSETS, 'vendor', 'katex-fonts.css'), 'utf8');
const raw = fs.readFileSync(path.join(dir, 'body.html'), 'utf8');

// ---- optional overrides via environment, so a parameter sweep needs no file edits ----
//   SHEET_BASE_PT=5.2  SHEET_MATH_EM=0.85  SHEET_COLS=5  SHEET_GAP_MM=1.9  SHEET_DISPLAY=1
const env = process.env;

// SHEET_CSS=<file> appends a stylesheet ON TOP of sheet.css, so a customisation (portrait paper,
// another typeface, different accent colours) lives in a few lines of its own file instead of a
// forked copy of the whole stylesheet. Appending also means it wins the cascade without needing
// !important. It sits after sheet.css is read and before the numeric knobs are applied.
if (env.SHEET_CSS) {
  const overlayPath = path.resolve(env.SHEET_CSS);
  if (!fs.existsSync(overlayPath)) {
    console.error('build: SHEET_CSS file not found: ' + overlayPath);
    process.exit(1);
  }
  css += '\n/* ---- overlay: ' + path.basename(overlayPath) + ' ---- */\n' +
         fs.readFileSync(overlayPath, 'utf8');
}

const ov = (name, def) => (env[name] === undefined || env[name] === '' ? def : env[name]);
const BASE_PT = ov('SHEET_BASE_PT', null);
const MATH_EM = ov('SHEET_MATH_EM', null);
const COLS    = ov('SHEET_COLS', null);
const GAP_MM  = ov('SHEET_GAP_MM', null);
const DISPLAY = env.SHEET_DISPLAY === '1';

if (COLS) css = css.replace(/column-count:\s*\d+/, 'column-count: ' + COLS);
if (GAP_MM) css = css.replace(/column-gap:\s*[\d.]+mm/, 'column-gap: ' + GAP_MM + 'mm');
if (BASE_PT) css = css.replace(/\.page \{([\s\S]*?)\}/, (mm, inner) =>
  mm.replace(inner, inner.replace(/font-size:\s*[\d.]+pt/, 'font-size: ' + BASE_PT + 'pt')));
if (MATH_EM) {
  // Math size is set as an ABSOLUTE target per context, never as a ratio stacked on the
  // formula box's own font-size. The three boxes have different font sizes (.fxc 1.09em,
  // .fxd 1.0em, .fxs 0.95em), so a shared ratio silently made the grey supporting box the
  // smallest math on the sheet - smaller than inline math in prose. Dividing each target
  // by its box's font-size keeps the intended hierarchy: core > standard > supporting > prose.
  const M = parseFloat(MATH_EM);
  const boxEm = (sel, def) => {
    const r = new RegExp('\\.' + sel + ' \\{([^}]*)\\}').exec(css);
    const m2 = r && /font-size:\s*([\d.]+)em/.exec(r[1]);
    return m2 ? parseFloat(m2[1]) : def;
  };
  const FXC_BOX = boxEm('fxc', 1.09);
  const FXS_BOX = boxEm('fxs', 0.95);
  const target = { fxc: M * 1.188, fxd: M * 1.094, fxs: M * 1.035, prose: M };
  const f = (v) => (Math.round(v * 10000) / 10000) + 'em';
  css += '\n/* math size by context - absolute, box font-size divided out */\n' +
    '.flow .fxc .katex { font-size: ' + f(target.fxc / FXC_BOX) + '; }\n' +
    '.flow .fxd .katex { font-size: ' + f(target.fxd) + '; }\n' +
    '.flow .fxs .katex { font-size: ' + f(target.fxs / FXS_BOX) + '; }\n' +
    '.flow p .katex, .flow .li .katex, .flow li .katex, .flow td .katex, .flow th .katex,' +
    '.flow blockquote .katex { font-size: ' + f(target.prose) + '; }\n';
  if (env.SHEET_VERBOSE) {
    console.log('  math em: fxc=' + f(target.fxc) + ' fxd=' + f(target.fxd) +
                ' fxs=' + f(target.fxs) + ' prose=' + f(target.prose) +
                '  (box em ' + FXC_BOX + '/' + FXS_BOX + ')');
  }
}

// SHEET_EXTRA_CSS=<file> appends an extra stylesheet, so alternatives can be compared
// inside a single render instead of one render per guess.
if (env.SHEET_EXTRA_CSS) {
  css += '\n' + fs.readFileSync(env.SHEET_EXTRA_CSS, 'utf8');
}

const m = /<!-- BODY:BEGIN -->([\s\S]*?)<!-- BODY:END -->/.exec(raw);
if (!m) { console.error('body.html: BODY markers not found - run md2body.js first'); process.exit(1); }

const failed = [];
let segIdx = 0;   // global .fxseg counter; fit-formulas.js addresses segments by this id

function tex(texSrc, display) {
  try {
    return katex.renderToString(texSrc, {
      // displayMode stays OFF even for display formulas: inline-style fractions render
      // compactly and can wrap inside a narrow column, whereas \displaystyle fractions
      // build nested inline-flex boxes that cannot break and blow the flow apart.
      // Visual prominence comes from the .fxc / .fxd / .fxs box, not from display mode.
      displayMode: DISPLAY,
      throwOnError: true,
      output: 'html',            // no MathML: smaller output, cleaner PDF text extraction
      strict: false,
      trust: false
    });
  } catch (e) {
    failed.push({ tex: texSrc.slice(0, 90), msg: String(e.message).replace(/\n[\s\S]*/, '') });
    // visible marker so a bad formula cannot pass silently
    return '<span class="unk">MATH ERROR: ' + texSrc.replace(/[<&]/g, '') + '</span>';
  }
}

// ---- CONSERVATIVE MODE (the default recommendation) ------------------------------------
// SHEET_NO_SPLIT=1 renders every $$ block as ONE atomic KaTeX formula and leaves the page to
// the browser's own line filling. Nothing is cut, nothing is re-joined, and no downstream
// stage has to reason about segments - so there is very little that can go wrong.
//
// The price is that a formula wider than the column simply overflows, which is why the
// workflow for this mode is: keep every formula short enough to fit one column, and let
// fit-formulas.js scale the few that still do not (it prints them so you can shorten the
// Markdown instead). Under this mode `<wbr>`/segment splitting is skipped entirely.
//
// The splitting below is the ADVANCED path (enabled with --split). It reads better when it
// works - continuation lines start at a relation, and a trailing annotation can share the
// previous line - but it is the part of the pipeline with the most moving parts and it is still
// not fully settled: a long chain of equalities fragments, bracket protection can strand a long
// tail, and the breaks are computed from one measurement pass so any font or column change
// invalidates them. Keep --split off unless long formulas dominate the sheet.
const NO_SPLIT = env.SHEET_NO_SPLIT === '1';

function block(texSrc, cls) {
  if (NO_SPLIT) {
    return '<div class="' + cls + '"><span class="fxseg" id="s' + (segIdx++) + '">' +
           tex(texSrc, false) + '</span></div>';
  }
  // Every piece is an atomic .fxseg; the only soft wrap opportunities are the <wbr>
  // elements between them, i.e. in front of a relation or a \qquad separator. There are no
  // nested blocks here on purpose - an earlier version emitted .fline divs, forgot to close
  // the last one, and the unclosed box swallowed the whole document.
  //
  // data-g marks the formula group (a new one after each \qquad separator) and data-ann
  // marks a trailing annotation such as \text{(MI)}. paginate.js uses both to keep a whole
  // formula on one line while still letting an annotation share the previous line.
  const segs = splitFormula(texSrc);
  const gid = [];
  let g = 0;
  segs.forEach((s, i) => { if (i > 0 && s.brk === 'quad') g++; gid[i] = g; });
  const ann = {};
  segs.forEach((s, i) => { if (i === 0 || gid[i] !== gid[i - 1]) ann[gid[i]] = /^\\text\{/.test(s.tex.trim()); });
  const inner = segs.map((s, i) =>
    (i ? '<wbr>' : '') + '<span class="fxseg" id="s' + (segIdx++) + '" data-g="' + gid[i] + '"' +
    (ann[gid[i]] ? ' data-ann="1"' : '') + '>' + tex(s.tex, false) + '</span>').join('');
  return '<div class="' + cls + '">' + inner + '</div>';
}

// ---- formula line breaking ------------------------------------------------------------
// A KaTeX formula must not break wherever the browser happens to run out of room: that
// orphans fragments mid-formula (measured: "= x)" pushed to the next line, and
// "H(X)+" / "H(Y|X)" split across lines). Instead the source is cut at TOP-LEVEL
// relational operators, and each piece is rendered as its own atomic nowrap span. A break
// can then only happen immediately before a relation, so continuation lines start with
// "=" or "\le" - which is exactly where a reader expects the break.
//
//   \qquad / \quad at top level -> forced line break (they separate independent formulas)
//   relation op at top level    -> soft break opportunity, operator kept at the line start
//   anything else               -> atomic, cannot break
const REL_CMDS = ['\\Longleftrightarrow', '\\Leftrightarrow', '\\Longrightarrow', '\\Rightarrow',
  '\\Leftarrow', '\\implies', '\\impliedby', '\\triangleq', '\\approx', '\\equiv', '\\notin',
  '\\subseteq', '\\supseteq', '\\simeq', '\\propto', '\\perp', '\\qquad', '\\quad', '\\neq',
  '\\geq', '\\leq', '\\iff', '\\sim', '\\ll', '\\gg', '\\ne', '\\ge', '\\le', '\\to', '\\in'];
const REL_CHARS = ['=', '<', '>', '\u2264', '\u2265', '\u2260', '\u2248'];
const FORCED = ['\\qquad', '\\quad'];
const wordEnd = (rest, n) => !/[a-zA-Z]/.test(rest[n] || ' ');

function splitFormula(src) {
  const out = [];
  let cur = '', depth = 0, paren = 0, i = 0;
  // pending describes the break that comes BEFORE the segment being built; flush() hands
  // that break to the segment just completed and stores the next one. Attaching it to the
  // closing segment instead is what once put "\qquad" line breaks in the wrong place.
  let pending = null;
  const flush = (nextBrk) => {
    if (cur.trim()) out.push({ tex: cur, brk: pending });
    cur = '';
    pending = nextBrk;
  };
  const open = () => depth === 0 && paren === 0;
  while (i < src.length) {
    const rest = src.slice(i);
    if (open()) {
      let hit = null;
      for (const f of FORCED) if (rest.startsWith(f) && wordEnd(rest, f.length)) { hit = f; break; }
      if (hit) {
        // A \qquad / \quad separates two formulas but is NOT a hard break: an annotation
        // such as "(MI)" or "for every e in (0,1)" should ride along on the previous line
        // whenever it still fits, and only start a new line when that line is full.
        // The spacer stays at the END of the finishing segment, so a wrapped line is not
        // indented while a shared line still gets the full gap. 'quad' marks a group
        // boundary for paginate.js, which decides the actual line breaks.
        cur += hit;
        flush('quad');
        i += hit.length;
        continue;
      }
      let rel = null;
      for (const r of REL_CMDS) if (rest.startsWith(r) && wordEnd(rest, r.length)) { rel = r; break; }
      if (!rel && REL_CHARS.indexOf(src[i]) >= 0 && src[i - 1] !== '\\') rel = src[i];
      if (rel) {
        flush('soft');
        // "{}" keeps TeX's relation spacing before the operator once it starts a segment
        cur = '{}' + rel;
        i += rel.length;
        continue;
      }
    }
    const c = src[i];
    // parentheses and brackets are argument groups too: never split the "=" in H(Y|X=x)
    if (rest.startsWith('\\{') || rest.startsWith('\\}')) {
      paren += rest.startsWith('\\{') ? 1 : -1;
      if (paren < 0) paren = 0;
    } else if (c === '(' || c === '[') paren++;
    else if (c === ')' || c === ']') paren = Math.max(0, paren - 1);
    else if (c === '{' && src[i - 1] !== '\\') depth++;
    else if (c === '}' && src[i - 1] !== '\\') depth = Math.max(0, depth - 1);
    cur += c;
    i++;
  }
  flush(null);
  return out.length ? out : [{ tex: src, brk: null }];
}

function convertFragment(html) {
  let s = html;
  s = s.replace(/\$\$!([\s\S]+?)\$\$/g, (mm, t) => block(t, 'fxc'));
  s = s.replace(/\$\$\?([\s\S]+?)\$\$/g, (mm, t) => block(t, 'fxs'));
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (mm, t) => block(t, 'fxd'));
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (mm, t) => block(t, 'fxd'));
  // Inline math is an atomic inline-block, so a sentence-final "." or "," right after it can
  // be pushed onto a line of its own - the sheet had eight bare "." lines and three bare ","
  // lines for exactly this reason. A WORD JOINER (U+2060) between the math and the
  // punctuation keeps them together without altering a single character of the text.
  const NJ = env.SHEET_NO_NJ ? '' : '\u2060';   // SHEET_NO_NJ=1 disables, for A/B testing
  s = s.replace(/\\\(([\s\S]+?)\\\)([.,;:])?/g, (mm, t, p) => tex(t, false) + (p ? NJ + p : ''));
  s = s.replace(/(^|[^\\])\$([^\$\n]+?)\$([.,;:])?/g,
    (mm, pre, t, p) => pre + tex(t, false) + (p ? NJ + p : ''));
  return s;
}

const body = convertFragment(m[1]);

// ---- page identity ---------------------------------------------------------------------
// The sheet describes itself: md2body reads the "# Title" line and the "Header:" / "Meta:" /
// "Footer:" lines of the leading blockquote into meta.json. Environment variables win, so a
// caller can retitle a sheet without editing the Markdown. Nothing course-specific lives here.
let metaJson = {};
try { metaJson = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')); } catch (e) { /* optional */ }
const head = {
  title: env.SHEET_TITLE || metaJson.title || 'CHEAT SHEET',
  subtitle: env.SHEET_SUBTITLE || metaJson.subtitle || '',
  meta: env.SHEET_META || metaJson.meta || '',
  footer: env.SHEET_FOOTER || metaJson.footer || 'Section order follows the source; colour encodes priority.'
};
const subHtml = head.subtitle ? ' <span class="sub">&nbsp;&middot;&nbsp;' + head.subtitle + '</span>' : '';
const priorityLegend = `<span class="k">priority</span>:
      <span class="pk3">&#9632;</span> must be automatic &nbsp;
      <span class="pk2">&#9632;</span> recurring &nbsp;
      <span class="pk1">&#9632;</span> in scope &nbsp;
      <span class="pk0">&#9632;</span> context`;

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>${head.title}</title>
<style>
${katexCss}
</style>
<style>
${css}
</style></head>
<body>
<!--PAGE:BEGIN-->
<div class="page">
  <!--HDR:BEGIN-->
  <div class="hdr">
    <h1>${head.title}${subHtml}</h1>
    <div class="meta">
      ${head.meta ? head.meta + ' &middot; ' : ''}${priorityLegend}
    </div>
  </div>
  <!--HDR:END-->
  <div class="grid">
    <div class="flow">
<!--FLOW:BEGIN-->
${body}
<!--FLOW:END-->
    </div>
  </div>
  <!--LEG:BEGIN-->
  <div class="legend">${head.footer}</div>
  <!--LEG:END-->
</div>
<!--PAGE:END-->
</body></html>`;

fs.writeFileSync(path.join(dir, 'sheet.html'), html, 'utf8');

console.log('sheet.html written  (' + (html.length / 1024).toFixed(1) + ' KB)');
if (failed.length) {
  console.log('WARNING - ' + failed.length + ' formula(s) failed to typeset:');
  for (const f of failed.slice(0, 12)) console.log('  ' + f.msg + '\n    in: ' + f.tex);
} else {
  console.log('OK - all formulas typeset by KaTeX');
}
