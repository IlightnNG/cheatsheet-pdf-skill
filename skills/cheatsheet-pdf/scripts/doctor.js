#!/usr/bin/env node
// doctor.js - answer "will this run on my machine?" before the user discovers it mid-sheet.
//
//   node doctor.js [--smoke]
//
// Checks the three things that break a first run (node version, Chrome, a writable temp dir),
// prints the effective defaults, and with --smoke renders the bundled regression example end to end
// so the whole pipeline - KaTeX, layout, print, thinning, gates - is exercised on this machine.
//
// Exit codes: 0 healthy, 1 a hard requirement is missing or the smoke test failed.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const LIB = path.join(HERE, 'lib');
const SKILL = path.resolve(HERE, '..');
const REPO = path.resolve(SKILL, '..', '..');
const smoke = process.argv.includes('--smoke');

let failed = 0;
const ok = (name, detail) => console.log('  ok    ' + name.padEnd(10) + detail);
const bad = (name, detail, fix) => { failed++; console.log('  FAIL  ' + name.padEnd(10) + detail + (fix ? '\n        fix: ' + fix : '')); };

// ---- node
const major = Number(process.versions.node.split('.')[0]);
if (major >= 18) ok('node', 'v' + process.versions.node + ' (need >=18)');
else bad('node', 'v' + process.versions.node + ' is too old (need >=18)', 'install Node 18 or newer');

// ---- chrome
let chrome = null;
try {
  chrome = require(path.join(LIB, 'env')).chromePath();
  ok('chrome', chrome);
} catch (e) {
  bad('chrome', 'not found', 'set CHROME_PATH to the browser executable (see the message below)\n        ' +
    String(e.message).split('\n').join('\n        '));
}

// ---- temp
const temp = path.join(os.tmpdir(), 'cheatsheet-pdf');
let tempOk = true;
try {
  fs.mkdirSync(temp, { recursive: true });
  const probe = path.join(temp, 'doctor-' + process.pid + '.txt');
  fs.writeFileSync(probe, 'ok');
  fs.unlinkSync(probe);
} catch (e) { tempOk = false; }
if (tempOk) ok('temp', temp);
else bad('temp', 'not writable: ' + temp, 'set CHEATSHEET_TMP to a writable directory (browser profiles go there)');

// ---- effective defaults (read from the stylesheet, not from a copy of the numbers)
const css = fs.readFileSync(path.join(HERE, 'sheet.css'), 'utf8');
const page = /\.page\s*\{([\s\S]*?)\}/.exec(css);
const flow = /\.flow\s*\{([^}]*)\}/.exec(css);
const pad = page && /padding:\s*([^;]+);/.exec(page[1]);
const cols = flow && /column-count:\s*(\d+)/.exec(flow[1]);
const base = page && /font-size:\s*([\d.]+)pt/.exec(page[1]);
const portrait = !/width:\s*297mm/.test(page ? page[1] : '');
console.log('\n  defaults   ' + (portrait ? 'portrait' : 'landscape A4') +
            '  cols=' + (cols ? cols[1] : '?') + '  base=' + (base ? base[1] + 'pt' : '?') +
            '  margin=' + (pad ? pad[1].trim() : '?') + '  pages=2');

// ---- smoke
if (smoke) {
  const example = path.join(REPO, 'examples', 'regression.md');
  if (!fs.existsSync(example)) {
    bad('smoke', 'examples/regression.md is missing', 're-clone the repository');
  } else if (chrome) {
    const out = path.join(temp, 'doctor-smoke.pdf');
    try {
      execFileSync(process.execPath, [path.join(HERE, 'cheatsheet.js'), example, out, '--pages=1', '--cols=4', '--quiet'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
      const v = execFileSync(process.execPath, [path.join(HERE, 'verify.js'), out],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
      const m = /(\d+)\/(\d+) gates passed/.exec(v);
      if (m && m[1] === m[2]) ok('smoke', m[1] + '/' + m[2] + ' gates on the regression example');
      else bad('smoke', 'gates failed', 'run: node "' + path.join(HERE, 'verify.js') + '" "' + out + '"');
    } catch (e) {
      bad('smoke', 'the pipeline threw', ((e.stdout || '') + (e.stderr || '')).trim().split('\n').slice(-3).join('\n        '));
    }
  }
}

console.log('\n  ' + (failed ? failed + ' problem(s) - fix them before rendering a real sheet' : 'ready - render with: node "' +
  path.join(HERE, 'cheatsheet.js') + '" <sheet.md> <sheet.pdf>'));
process.exit(failed ? 1 : 0);
