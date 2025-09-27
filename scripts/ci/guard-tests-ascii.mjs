#!/usr/bin/env node
// ASCII gate for tests directory only. Writes a report and exits with:
// - 0 (pass) when no non-ASCII found
// - 0 (warn) when non-ASCII found in local (CI=false)
// - 1 (fail) when non-ASCII found in CI (CI=true)

import fs from 'node:fs';
import path from 'node:path';

const CI = String(process.env.CI || 'false').toLowerCase() === 'true';
const ROOT = process.cwd();
const INCLUDE = process.env.TESTS_ASCII_SCOPE || 'tests';
const TARGET_DIRS = INCLUDE.split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(p => path.resolve(ROOT, p));

function listFiles(entry) {
  const out = [];
  if (!fs.existsSync(entry)) return out;
  const stat = fs.statSync(entry);
  if (stat.isFile()) return /\.(ts|tsx|js|mjs)$/i.test(entry) ? [entry] : [];
  const stack = [entry];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (/\.(ts|tsx|js|mjs)$/i.test(p)) out.push(p);
    }
  }
  return out;
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
const logFile = path.join(logDir, `encoding-tests-${hh}${mi}${ss}Z.log`);

const findings = [];
for (const dir of TARGET_DIRS) {
  for (const file of listFiles(dir)) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (/[^\x00-\x7F]/.test(line)) {
        findings.push({ file, line: idx + 1, text: line });
      }
    });
  }
}

if (findings.length === 0) {
  fs.writeFileSync(
    logFile,
    'ASCII gate passed: tests are ASCII-only\n',
    'utf8'
  );
  console.log(`ASCII gate (tests): PASS -> ${logFile}`);
  process.exit(0);
}

let out = 'Non-ASCII found in tests files (first 200 lines):\n';
for (const f of findings.slice(0, 200)) {
  out += `${path.relative(ROOT, f.file)}:${f.line}: ${f.text}\n`;
}
out += `\nTotal findings: ${findings.length}\n`;
fs.writeFileSync(logFile, out, 'utf8');
console.log(`ASCII gate (tests): ${CI ? 'FAIL' : 'WARN'} -> ${logFile}`);
if (CI) process.exit(1);
process.exit(0);
