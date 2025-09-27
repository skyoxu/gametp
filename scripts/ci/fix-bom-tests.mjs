#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CI = String(process.env.CI || 'false').toLowerCase() === 'true';
if (!CI) {
  console.log('fix-bom-tests: CI=false, skip');
  process.exit(0);
}
const BASE = path.join(ROOT, 'tests');
const EXTS = new Set(['.ts', '.tsx', '.js', '.mjs']);

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (EXTS.has(path.extname(p))) out.push(p);
    }
  }
  return out;
}

function hasBOM(buf) {
  return (
    buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf
  );
}

const now = new Date();
const yyyy = now.getUTCFullYear();
const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
const dd = String(now.getUTCDate()).padStart(2, '0');
const hh = String(now.getUTCHours()).padStart(2, '0');
const mi = String(now.getUTCMinutes()).padStart(2, '0');
const ss = String(now.getUTCSeconds()).padStart(2, '0');
const logDir = path.join('logs', 'ci', `${yyyy}-${mm}-${dd}`);
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, `fix-bom-tests-${hh}${mi}${ss}Z.log`);

let fixed = 0;
let checked = 0;
for (const f of listFiles(BASE)) {
  try {
    const buf = fs.readFileSync(f);
    checked++;
    if (hasBOM(buf)) {
      fs.writeFileSync(f, buf.slice(3));
      fixed++;
      fs.appendFileSync(logFile, `FIXED: ${path.relative(ROOT, f)}\n`, 'utf8');
    }
  } catch (e) {
    fs.appendFileSync(
      logFile,
      `WARN: cannot process ${path.relative(ROOT, f)}: ${String(e.message || e)}\n`,
      'utf8'
    );
  }
}
fs.appendFileSync(
  logFile,
  `\nChecked: ${checked} files, Fixed: ${fixed}\n`,
  'utf8'
);
console.log(`fix-bom-tests: checked ${checked}, fixed ${fixed} -> ${logFile}`);
