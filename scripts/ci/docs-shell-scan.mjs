#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Scan markdown docs for non-Windows shell patterns and report in Step Summary
const roots = ['docs', path.join('.github','docs'), path.join('scripts','release')];
const stepSummary = process.env.GITHUB_STEP_SUMMARY || '';
const eventName = (process.env.GITHUB_EVENT_NAME || '').toLowerCase();
const ref = process.env.GITHUB_REF || '';

function listMarkdown(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (p.toLowerCase().endsWith('.md')) out.push(p);
    }
  }
  return out;
}

const files = roots.flatMap(listMarkdown);
const hits = [];
const suspicious = [];
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  if (/```\s*bash\b/.test(c)) hits.push(f);
  const suspiciousRe = /(rm -rf\s+|\bgrep\b|\bsed\b|\bchmod\b|\bchown\b|\bln -s\b|\btail -f\b|\bhead -n\b|\bwhich\b|cut -d|\bawk\b)/i;
  if (suspiciousRe.test(c)) suspicious.push(f);
}

const lines = [];
lines.push('## Docs Shell Scan');
lines.push('');
if (hits.length) {
  lines.push('- Status: WARN');
  lines.push('- Found bash code fences in:');
  for (const f of hits) lines.push(`  - ${f}`);
  lines.push('');
  lines.push('建议：提供 PowerShell 等效代码块，或在段落中标注“仅作参考”。');
  lines.push('Tip: Prefer PowerShell code fences over bash for Windows-only docs.');
} else {
  lines.push('- Status: PASS');
  lines.push('- No bash code fences found in scanned docs.');
}

if (suspicious.length) {
  lines.push('');
  lines.push('### Potentially non-Windows commands detected');
  for (const f of suspicious) lines.push(`- ${f}`);
  lines.push('说明：检测到 rm/grep/sed/awk/cut/ln/head/tail/which 等 Linux 命令，请补充 PowerShell 对应写法。');
  lines.push('Tip: See docs/maintainers/POWERSHELL_EQUIVALENTS.md for mapping.');
}

if (stepSummary) {
  try { fs.appendFileSync(stepSummary, lines.join('\n') + '\n', 'utf8'); } catch {}
}

// Gate policy: only hard-fail on push to main if bash fences exist
const isMainPush = eventName === 'push' && /refs\/heads\/main$/.test(ref);
if (hits.length && isMainPush) {
  console.error('bash code fences found in docs on main push:');
  for (const f of hits) console.error(' - ' + f);
  process.exit(1);
}
console.log(`Scanned ${files.length} markdown files; bash fences: ${hits.length}`);
