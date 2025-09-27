#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const roots = ['docs', path.join('.github','docs'), path.join('scripts','release')];
const stepSummary = process.env.GITHUB_STEP_SUMMARY || '';
let prLabelsRaw = process.env.PR_LABELS || '';
const waiveListRaw = process.env.WINDOWS_ONLY_DOCS_WAIVE_LABELS || 'windows-docs-waive,windows-guard-waive,size-waive';
// Try to load labels from event payload if not provided
if (!prLabelsRaw && process.env.GITHUB_EVENT_PATH) {
  try {
    const payload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const names = (payload.pull_request && payload.pull_request.labels || []).map(l => (l.name || '').toLowerCase());
    prLabelsRaw = names.join(',');
  } catch {}
}
const prLabels = new Set((prLabelsRaw || '').split(/[\,\n]/).map(s => s.trim().toLowerCase()).filter(Boolean));
const waiveLabels = new Set(waiveListRaw.split(/[\,\n]/).map(s => s.trim().toLowerCase()).filter(Boolean));

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
  const suspiciousRe = /(rm -rf\s+|\bgrep\s+|\bsed\s+|\bchmod\s+|\bchown\s+|\bln -s\b|tail -f\b|head -n\b|\bwhich\s+|cut -d|\bawk\b)/i;
  if (suspiciousRe.test(c)) suspicious.push(f);
}

const lines = [];
lines.push('## Docs Shell Light Gate (PR)');
lines.push('- Mode: PR light gate (labels can waive)');
lines.push('');
if (hits.length) {
  lines.push('- Found bash code fences in:');
  for (const f of hits) lines.push(`  - ${f}`);
}
if (suspicious.length) {
  lines.push('');
  lines.push('### Potentially non-Windows commands detected');
  for (const f of suspicious) lines.push(`- ${f}`);
}
if (!hits.length && !suspicious.length) {
  lines.push('- PASS: no bash fences or suspicious Linux commands detected.');
}

if (stepSummary) {
  try { fs.appendFileSync(stepSummary, lines.join('\n') + '\n', 'utf8'); } catch {}
}

if (hits.length > 0 || suspicious.length > 0) {
  const hasWaive = Array.from(waiveLabels).some(w => prLabels.has(w));
  if (hasWaive) {
    console.error('[WAIVED] Docs shell issues waived by label: ' + Array.from(waiveLabels).join(', '));
    process.exit(0);
  } else {
    console.error('Docs shell light gate failed — add one of these labels to waive:');
    console.error(Array.from(waiveLabels).join(', '));
    process.exit(1);
  }
}
console.log(`Docs shell light gate passed. Scanned ${files.length} files.`);
