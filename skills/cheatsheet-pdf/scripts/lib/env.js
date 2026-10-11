// env.js - the single place that answers: where is Chrome, where do outputs go, where are
// the read-only assets, and where is a throwaway browser profile?
//
// The work/assets split is what makes this tool usable on someone else's machine:
//   ASSETS  the installed skill's scripts/ directory (sheet.css, vendor/, lib/, tools/).
//           Read-only - generated files must never land here.
//   WORK    the directory holding body.html / sheet.html and receiving the PDF.
//           Defaults to the current working directory, override with SHEET_DIR.
//
// Environment
//   CHROME_PATH / CHROME_BIN   explicit browser executable
//   SHEET_DIR                  working directory for generated files   (default: cwd)
//   CHEATSHEET_TMP             parent directory for browser profiles   (default: OS temp)
//   CHROME_TIMEOUT             ms before a headless Chrome call is killed (default 120000)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const ASSETS = path.resolve(__dirname, '..');           // .../scripts
const WORK = process.env.SHEET_DIR ? path.resolve(process.env.SHEET_DIR) : process.cwd();

const CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium'
];

let cached = null;

function isFile(p) {
  if (!p) return false;
  try { return fs.statSync(p).isFile(); } catch (e) { return false; }
}

// Locate a Chrome/Chromium build. Throws with actionable instructions rather than failing
// later inside a child process with an opaque error.
function chromePath() {
  if (cached) return cached;
  for (const c of CANDIDATES) if (isFile(c)) { cached = c; return c; }
  const names = process.platform === 'win32'
    ? ['chrome.exe', 'chromium.exe', 'msedge.exe']
    : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const n of names) {
      const p = path.join(dir, n);
      if (isFile(p)) { cached = p; return p; }
    }
  }
  throw new Error(
    'Chrome/Chromium not found. Point CHROME_PATH at the executable, e.g.\n' +
    '  PowerShell : $env:CHROME_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"\n' +
    '  bash       : export CHROME_PATH=/usr/bin/google-chrome\n' +
    'Looked at: ' + CANDIDATES.filter(Boolean).join(', '));
}

function tempRoot() {
  return process.env.CHEATSHEET_TMP || path.join(os.tmpdir(), 'cheatsheet-pdf');
}

// A brand-new profile per process. Two independent reasons, both learned the hard way:
//   1. a REUSED profile serves cached file:// resources, so a measurement or screenshot can
//      silently describe the PREVIOUS build;
//   2. profiles on the system drive can fill it (2.5 GB observed) and break the run with a
//      confusing ENOSPC.
function profile(name) {
  const dir = path.join(tempRoot(), name + '-' + process.pid);
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* nothing to remove */ }
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const BASE_FLAGS = [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-dev-shm-usage', '--disable-crash-reporter', '--disable-breakpad'
];

function baseArgs(prof) { return BASE_FLAGS.concat(['--user-data-dir=' + prof]); }

function timeoutMs() { return Number(process.env.CHROME_TIMEOUT || 120000); }

// file:// URL with an optional cache-busting query, so a stale entry can never masquerade as
// a fresh render even if a profile is somehow reused.
function fileUrl(p, bust) {
  const u = 'file:///' + path.resolve(p).replace(/\\/g, '/');
  return bust ? u + '?v=' + Date.now() : u;
}

function ensureWork() {
  fs.mkdirSync(WORK, { recursive: true });
  return WORK;
}

module.exports = {
  ASSETS, WORK, chromePath, tempRoot, profile, baseArgs, timeoutMs, fileUrl, ensureWork, isFile
};
