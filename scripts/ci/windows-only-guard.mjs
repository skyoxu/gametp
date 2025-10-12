#!/usr/bin/env node
/**
 * Windows-only guard
 * - Forbid any usage of `shell: bash` in .github/** (workflows + composite actions)
 * - Forbid non-Windows runners in workflows (ubuntu-latest, macos-latest)
 * - Forbid repository-managed *.sh scripts outside of whitelisted folders
 *   Whitelist: .husky/**, node_modules/**, dist/**, logs/**, coverage/**, test-results/**, dist-electron/**, reports/**
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function listFiles(dir, exts) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let ents = [];
    try {
      ents = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (exts.some(x => p.toLowerCase().endsWith(x))) out.push(p);
    }
  }
  return out;
}

function readUtf8(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

const violations = [];
const eventName = process.env.GITHUB_EVENT_NAME || '';
const prLabelsRaw = process.env.PR_LABELS || '';
const waiveListRaw =
  process.env.WINDOWS_ONLY_GUARD_WAIVE_LABELS ||
  'windows-guard-waive,size-waive';
const prLabels = new Set(
  prLabelsRaw
    .split(/[\,\n]/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
);
const waiveLabels = new Set(
  waiveListRaw
    .split(/[\,\n]/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
);
const summaryPath = process.env.GITHUB_STEP_SUMMARY || '';

function writeSummary(status, waived, items) {
  if (!summaryPath) return;
  try {
    const lines = [];
    lines.push('## Windows-only Guard');
    lines.push('');
    lines.push(`- Status: ${status}${waived ? ' (WAIVED)' : ''}`);
    if (waived) {
      lines.push(`- Waive Labels: ${Array.from(waiveLabels).join(', ')}`);
    }
    if (items && items.length) {
      lines.push('');
      lines.push('### Violations');
      for (const it of items) lines.push(`- ${it}`);
    }
    require('node:fs').appendFileSync(
      summaryPath,
      lines.join('\n') + '\n',
      'utf8'
    );
  } catch {}
}

// 1) Scan .github (workflows + actions)
const ghDir = path.join(root, '.github');
const ghFiles = listFiles(ghDir, ['.yml', '.yaml']);
for (const f of ghFiles) {
  const c = readUtf8(f);
  if (/\bshell:\s*bash\b/i.test(c)) {
    violations.push(`${f}: contains 'shell: bash' (Windows-only repo)`);
  }
  if (/runs-on:\s*(ubuntu-latest|macos-latest)/i.test(c)) {
    violations.push(`${f}: contains non-Windows runner (ubuntu/macos)`);
  }
  if (/matrix:([\s\S]*?)os:\s*\[([^\]]+)\]/i.test(c)) {
    const m = c.match(/matrix:([\s\S]*?)os:\s*\[([^\]]+)\]/i);
    const list = (m?.[2] || '').toLowerCase();
    if (/(ubuntu|macos|linux)/.test(list)) {
      violations.push(`${f}: matrix.os includes non-Windows targets`);
    }
  }
}

// 2) Scan for *.sh in repository (excluding known third-party or tooling folders)
const shFiles = listFiles(root, ['.sh']).filter(p => {
  const rel = path.relative(root, p).replace(/\\/g, '/');
  return !(
    rel.startsWith('node_modules/') ||
    rel.startsWith('.husky/') ||
    rel.startsWith('dist/') ||
    rel.startsWith('dist-electron/') ||
    rel.startsWith('coverage/') ||
    rel.startsWith('logs/') ||
    rel.startsWith('test-results/') ||
    rel.startsWith('reports/')
  );
});
for (const f of shFiles)
  violations.push(`${f}: shell script not allowed in Windows-only repo`);

if (violations.length) {
  const isPR = eventName.toLowerCase() === 'pull_request';
  const hasWaive = isPR && Array.from(waiveLabels).some(w => prLabels.has(w));
  console.error('Windows-only guard violations:');
  for (const v of violations) console.error(' - ' + v);
  if (hasWaive) {
    console.error(
      '[WAIVED] PR labeled with one of: ' + Array.from(waiveLabels).join(', ')
    );
    writeSummary('FAIL', true, violations);
    process.exit(0);
  }
  writeSummary('FAIL', false, violations);
  process.exit(1);
} else {
  console.log(
    'Windows-only guard passed: no bash/shell scripts or non-Windows runners found.'
  );
  writeSummary('PASS', false, []);
}
