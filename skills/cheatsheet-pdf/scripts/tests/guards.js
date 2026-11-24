#!/usr/bin/env node
// guards.js - the checks that protect the look, tested without a browser.
//
//   node guards.js
//
// Each case is a fixture under examples/fixtures/ plus the result the guard must produce. The point
// is not coverage for its own sake: every case is a defect that once reached a printed sheet or a
// real user's build (filler after the last chapter, a chapter with no statements, unsupported
// markup, a glyph the fonts lack). Runs in about a second, so it can gate every commit.
//
// Exit 0 when every case matches, 1 otherwise.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const SCRIPTS = path.resolve(HERE, '..');
const REPO = path.resolve(SCRIPTS, '..', '..', '..');
const FIX = path.join(REPO, 'examples', 'fixtures');

const cases = [
  {
    name: 'good sheet: lint clean',
    file: 'good.md',
    run: 'lint',
    expectCode: 0,
    expect: /LINT 0 error/,
  },
  {
    name: 'good sheet: style clean',
    file: 'good.md',
    run: 'style',
    expectCode: 0,
    expect: /STYLE 0 error/,
  },
  {
    name: 'top-level heading is not a chapter',
    file: 'appendix.md',
    run: 'lint',
    expectCode: 1,
    expect: /top-level heading .* not a chapter/,
  },
  {
    name: 'unsupported markup is reported',
    file: 'markup.md',
    run: 'lint',
    expectCode: 1,
    expect: /unsupported "__bold__"/,
  },
  {
    name: 'strikethrough is reported',
    file: 'markup.md',
    run: 'lint',
    expectCode: 1,
    expect: /unsupported "~~strike~~"/,
  },
  {
    name: 'box-drawing glyph is reported',
    file: 'markup.md',
    run: 'lint',
    expectCode: 1,
    expect: /box-drawing stroke/,
  },
  {
    name: 'escaped table pipe is reported',
    file: 'markup.md',
    run: 'lint',
    expectCode: 1,
    expect: /escaped pipe/,
  },
  {
    name: 'statements must live in their chapter (advice)',
    file: 'skewed.md',
    run: 'style',
    expectCode: 0,
    expect: /no "Statements to judge" section/,
  },
  {
    name: 'a chapter without a worked example is reported',
    file: 'skewed.md',
    run: 'style',
    expectCode: 0,
    expect: /no worked example/,
  },
  {
    name: 'a past paper without a formula drill is reported',
    file: 'exams-only.md',
    run: 'style',
    expectCode: 0,
    expect: /no formula drill/,
  },
  {
    name: 'a drill counts as the worked example',
    file: 'good.md',
    run: 'style',
    expectCode: 0,
    expect: /STYLE 0 error/,
  },
  {
    name: '--strict-style makes the skeleton fatal',
    file: 'skewed.md',
    run: 'style',
    args: ['--strict'],
    expectCode: 1,
    expect: /STYLE ERROR skeleton/,
  },
];

function run(c) {
  const md = path.join(FIX, c.file);
  if (!fs.existsSync(md)) return { code: 2, out: 'fixture missing: ' + md };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guards-'));
  const env = Object.assign({}, process.env, { SHEET_DIR: path.join(tmp, '.cheatsheet') });
  try {
    let out;
    if (c.run === 'lint') {
      // --lint builds the body first, so the markup checks actually see the rendered HTML
      out = execFileSync(process.execPath, [path.join(SCRIPTS, 'cheatsheet.js'), md, '--lint'],
        { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
      return { code: 0, out };
    }
    out = execFileSync(process.execPath, [path.join(SCRIPTS, 'lib', 'style.js'), md].concat(c.args || []),
      { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status === undefined ? 1 : e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

let failed = 0;
for (const c of cases) {
  const r = run(c);
  const okCode = r.code === c.expectCode;
  const okText = c.expect.test(r.out);
  const ok = okCode && okText;
  if (!ok) failed++;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + c.name.padEnd(46) +
    (ok ? '' : '  (exit ' + r.code + ', expected ' + c.expectCode + '; text ' + (okText ? 'ok' : 'missing') + ')'));
  if (!ok) console.log(r.out.split('\n').filter((l) => /ERROR|WARN|top-level|unsupported|skeleton/.test(l)).slice(0, 3).map((l) => '        ' + l).join('\n'));
}
console.log('\n  ' + (cases.length - failed) + '/' + cases.length + ' guard cases passed');
process.exit(failed ? 1 : 0);
