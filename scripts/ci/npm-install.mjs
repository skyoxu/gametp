#!/usr/bin/env node
/**
 * Stable npm install helper (Windows-friendly, Node 22.x)
 * - Prefers `npm ci` when lockfile exists; falls back to `npm install` once on failure
 * - Retries with backoff; captures stdout/stderr; writes structured logs under logs/YYYY-MM-DD/npm-install/
 * - Modes: full | lean (lean adds --ignore-scripts and --omit=optional)
 *
 * Usage:
 *   node scripts/ci/npm-install.mjs --cwd . --mode full
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseArgs(argv) {
  const out = { cwd: process.cwd(), mode: 'full' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cwd') { out.cwd = resolve(argv[++i] || '.'); continue; }
    if (a === '--mode') { out.mode = String(argv[++i] || 'full'); continue; }
  }
  if (out.mode !== 'full' && out.mode !== 'lean') out.mode = 'full';
  return out;
}

function logPath() {
  const base = join('logs', today(), 'npm-install');
  mkdirSync(base, { recursive: true });
  return join(base, 'npm-install.log');
}

function run(cmd, args, cwd) {
  return new Promise(resolve => {
    const child = spawn(cmd, args, { cwd, shell: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}

async function main() {
  const opts = parseArgs(process.argv);
  const log = logPath();
  const hasLock = existsSync(join(opts.cwd, 'package-lock.json'));
  const cmd = 'npm';

  // Harden npm defaults to reduce transient failures
  await run(cmd, ['config', 'set', 'fetch-retries', '5'], opts.cwd);
  await run(cmd, ['config', 'set', 'fetch-retry-factor', '2'], opts.cwd);
  await run(cmd, ['config', 'set', 'fetch-retry-mintimeout', '20000'], opts.cwd);
  await run(cmd, ['config', 'set', 'fetch-retry-maxtimeout', '120000'], opts.cwd);
  await run(cmd, ['config', 'set', 'progress', 'false'], opts.cwd);

  const isLean = opts.mode === 'lean';
  const base = hasLock ? ['ci'] : ['install'];
  const leanArgs = isLean ? ['--ignore-scripts', '--omit=optional'] : [];
  const common = [...base, '--no-audit', '--fund=false'];

  const max = 3;
  const start = Date.now();
  let res = { code: -1, stdout: '', stderr: '' };
  let used = [];
  for (let i = 0; i < max; i++) {
    used = [...common, ...leanArgs];
    res = await run(cmd, used, opts.cwd);
    if (res.code === 0) break;
    // Single-shot fallback from ci -> install on first failure (e.g., lock mismatch EUSAGE)
    if (i === 0 && base[0] === 'ci') {
      const fallback = ['install', '--no-audit', '--fund=false', ...leanArgs];
      const r2 = await run(cmd, fallback, opts.cwd);
      if (r2.code === 0) { res = r2; used = fallback; break; }
    }
    await new Promise(r => setTimeout(r, 5000 * (i + 1)));
  }
  const end = Date.now();
  const payload = {
    when: new Date().toISOString(),
    cwd: opts.cwd,
    mode: opts.mode,
    had_lockfile: hasLock,
    command: `${cmd} ${used.join(' ')}`.trim(),
    duration_ms: end - start,
    exit_code: res.code,
  };
  writeFileSync(
    log,
    JSON.stringify(payload, null, 2) +
      '\n--- STDOUT ---\n' + res.stdout +
      '\n--- STDERR ---\n' + res.stderr,
    { encoding: 'utf8' }
  );
  if (res.code !== 0) {
    console.error(`[npm-install] failed with code=${res.code}. See ${log}`);
    process.exit(res.code);
  }
  console.log(`[npm-install] ok: ${payload.command} (log: ${log})`);
}

await main();

