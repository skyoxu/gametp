#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf-8', ...opts });
  if (res.error) throw res.error;
  return { code: res.status ?? 0, stdout: res.stdout.trim(), stderr: res.stderr.trim() };
}

// 1) Find tracked files under dist/ and dist-electron/
const tracked = run('git', ['ls-files', '--', 'dist', 'dist-electron']);
if (tracked.code !== 0) {
  console.error('[guard-artifacts] git ls-files failed:', tracked.stderr);
  process.exit(1);
}

if (tracked.stdout) {
  console.error('\n[guard-artifacts] Blocking commit: build artifacts must not be tracked.');
  console.error('The following files are tracked under dist/ or dist-electron/:');
  console.error(tracked.stdout);
  console.error('\nHow to fix:');
  console.error('  - Remove these files from git (git rm -r --cached dist dist-electron)');
  console.error('  - Ensure .gitignore contains dist/ and dist-electron/');
  process.exit(1);
}

// 2) Optional: if working tree has files in these dirs, just warn (they should be ignored)
const untracked = run('git', ['ls-files', '--others', '--exclude-standard', '--', 'dist', 'dist-electron']);
if (untracked.stdout) {
  console.log('[guard-artifacts] Untracked build artifacts detected (OK if ignored):');
  console.log(untracked.stdout);
}

console.log('[guard-artifacts] OK: No tracked build artifacts under dist/ or dist-electron/.');

