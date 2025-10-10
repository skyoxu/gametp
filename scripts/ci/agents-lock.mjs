#!/usr/bin/env node
/**
 * Agents Lock Guard
 * Blocks changes to AGENTS.md in PRs unless an allow label is present.
 * Intended to prevent accidental regressions of contributor guidance.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function run(cmd, args = []) {
  const r = spawnSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32' });
  if (r.error) throw r.error;
  const out = (r.stdout ? r.stdout.toString('utf8') : '').trim();
  return { code: r.status ?? 0, out };
}

function hasAllowLabel() {
  const raw = String(process.env.PR_LABELS || '').toLowerCase();
  const allows = String(process.env.AGENTS_ALLOW_LABELS || 'agents-update,agents-waive')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return allows.some(lbl => raw.split(',').map(s => s.trim()).includes(lbl));
}

function getChangedFiles() {
  const event = String(process.env.GITHUB_EVENT_NAME || '').toLowerCase();
  try {
    if (event === 'pull_request') {
      // Prefer explicit base SHA from workflow env
      const baseSha = process.env.PR_BASE_SHA || '';
      if (baseSha) {
        const diff = run('git', ['diff', '--name-only', `${baseSha}`, 'HEAD']);
        if (diff.code === 0) return diff.out.split(/\r?\n/).filter(Boolean);
      }
      // Fallback to base ref (requires fetch-depth: 0)
      const baseRef = process.env.GITHUB_BASE_REF || process.env.PR_BASE_REF || '';
      if (baseRef) {
        // Ensure remote base exists locally
        run('git', ['fetch', 'origin', baseRef, '--depth=1']);
        const diff = run('git', ['diff', '--name-only', `origin/${baseRef}...HEAD`]);
        if (diff.code === 0) return diff.out.split(/\r?\n/).filter(Boolean);
      }
    }
    // Push: compare against previous commit
    const diff = run('git', ['diff', '--name-only', 'HEAD~1', 'HEAD']);
    if (diff.code === 0) return diff.out.split(/\r?\n/).filter(Boolean);
  } catch (_) {}
  return [];
}

function main() {
  if (!existsSync('AGENTS.md')) {
    console.log('[agents-lock] No AGENTS.md at repo root; skipping');
    process.exit(0);
  }

  // Best-effort sanity read
  try { readFileSync('AGENTS.md', 'utf8'); } catch {}

  const changed = getChangedFiles();
  const touched = changed.includes('AGENTS.md');

  if (!touched) {
    console.log('[agents-lock] AGENTS.md not modified in this change set. OK');
    process.exit(0);
  }

  if (hasAllowLabel()) {
    console.log('[agents-lock] Allow label detected; permitting AGENTS.md update');
    process.exit(0);
  }

  console.error('[agents-lock] AGENTS.md modification detected but no allow label present.');
  console.error('  To proceed, add one of the labels: agents-update, agents-waive');
  console.error('  Or update repository rules to allow changes to AGENTS.md explicitly.');
  process.exit(1);
}

main();

