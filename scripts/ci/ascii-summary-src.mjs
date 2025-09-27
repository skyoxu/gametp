#!/usr/bin/env node
// ASCII-only summary for src/** non-ASCII scan. Appends to GitHub Step Summary if available.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASE = path.join(ROOT, 'src');

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
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

function scanFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const hits = [];
  lines.forEach((line, i) => {
    if (/[^\x00-\x7F]/.test(line)) hits.push({ line: i + 1, text: line });
  });
  return hits;
}

function timestampParts(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return { yyyy, mm, dd, hh, mi, ss };
}

const { yyyy, mm, dd, hh, mi, ss } = timestampParts();
const logDir = path.join('logs', 'ci', `${yyyy}-${mm}-${dd}`);
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, `ascii-summary-src-${hh}${mi}${ss}Z.log`);

const files = listFiles(BASE);
const summary = [];
for (const f of files) {
  const hits = scanFile(f);
  if (hits.length) summary.push({ file: path.relative(ROOT, f), hits });
}

summary.sort((a, b) => b.hits.length - a.hits.length);
const top = summary.slice(0, 10);
let out = 'ASCII summary (src/**) - top 10 files by non-ASCII count\n';
if (top.length === 0) {
  out += '\nNo non-ASCII found in src/**\n';
} else {
  for (const s of top) {
    out += `\n[${s.hits.length}] ${s.file}\n`;
    s.hits.slice(0, 5).forEach(h => {
      out += `  - L${h.line}: ${h.text}\n`;
    });
  }
}
fs.writeFileSync(logFile, out, 'utf8');

// Append to GitHub Step Summary if available
try {
  const stepSummary = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummary && stepSummary.length > 0) {
    const header = `\n\n### ASCII Summary (src/**)\nGenerated at: ${new Date().toISOString()}\n`;
    fs.appendFileSync(stepSummary, header + out, 'utf8');
  }
} catch {}

console.log(`ascii-summary-src: wrote ${logFile}`);
