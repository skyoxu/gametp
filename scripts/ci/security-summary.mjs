#!/usr/bin/env node
import fs from 'node:fs';

const summaryPath = process.env.GITHUB_STEP_SUMMARY;

function readJSON(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function summarizeSnyk(obj) {
  // Snyk JSON can vary; best-effort counts
  const issues = obj?.vulnerabilities || obj?.issues || [];
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
  for (const v of issues) {
    const s = String(v.severity || v.severityLevel || '').toLowerCase();
    if (counts[s] !== undefined) counts[s]++;
  }
  return counts;
}

function summarizeNpmAudit(obj) {
  const advisories = obj?.advisories || {};
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
  for (const k of Object.keys(advisories)) {
    const adv = advisories[k];
    const s = String(adv?.severity || '').toLowerCase();
    if (counts[s] !== undefined) counts[s]++;
  }
  return counts;
}

const snyk = readJSON('snyk-report.json');
const npmAudit = readJSON('npm-audit.json');

const lines = [];
lines.push('# Security Summary');
if (snyk) {
  const c = summarizeSnyk(snyk);
  lines.push('\n## Snyk');
  lines.push(`- critical: ${c.critical}`);
  lines.push(`- high: ${c.high}`);
  lines.push(`- moderate: ${c.moderate}`);
  lines.push(`- low: ${c.low}`);
} else {
  lines.push('\n## Snyk');
  lines.push('- No snyk-report.json found');
}

if (npmAudit) {
  const c = summarizeNpmAudit(npmAudit);
  lines.push('\n## npm audit');
  lines.push(`- critical: ${c.critical}`);
  lines.push(`- high: ${c.high}`);
  lines.push(`- moderate: ${c.moderate}`);
  lines.push(`- low: ${c.low}`);
} else {
  lines.push('\n## npm audit');
  lines.push('- No npm-audit.json found');
}

const out = lines.join('\n');
console.log(out);
if (summaryPath) {
  fs.writeFileSync(summaryPath, out + '\n', { flag: 'a' });
}
