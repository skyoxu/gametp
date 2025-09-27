#!/usr/bin/env node
// English-only comments and logs. No emoji.
// Purpose: Lightweight packaging smoke check without heavy build by default.
// References: ADR-0005 (quality gates), ADR-0002 (Electron security)

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

function stamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function ensureDir(sub) {
  const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const p = join(process.cwd(), 'logs', dateDir, sub);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
  return p;
}

async function maybeBuild() {
  const shouldBuild = /^(1|true|yes)$/i.test(
    String(process.env.SMOKE_PACK_BUILD || '')
  );
  if (!shouldBuild) return { skipped: true };
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', '-s', 'build'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('close', code => {
      if (code === 0) resolve({ skipped: false });
      else reject(new Error(`build failed with code ${code}`));
    });
  });
}

async function main() {
  const outDir = ensureDir('pack');
  const outFile = join(outDir, `pack-smoke-${stamp()}.json`);

  const buildInfo = await maybeBuild();

  const distExists = existsSync(join(process.cwd(), 'dist'));
  const electronMain = join(
    process.cwd(),
    'dist-electron',
    'electron',
    'main.js'
  );
  const electronMainExists = existsSync(electronMain);

  const result = {
    timestamp: new Date().toISOString(),
    build: buildInfo?.skipped ? 'skipped' : 'attempted',
    checks: {
      distExists,
      electronMainExists,
    },
    hints: {
      electronMainPath: electronMain,
      enableBuild: 'Set SMOKE_PACK_BUILD=1 to attempt a build before checking.',
    },
    passed: distExists && electronMainExists,
  };

  writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(
    `[pack-smoke] dist: ${distExists}, electron main: ${electronMainExists}`
  );
  console.log(`[pack-smoke] Result saved to: ${outFile}`);
  process.exit(result.passed ? 0 : 1);
}

main().catch(e => {
  console.error(`[pack-smoke] Failed: ${e.message}`);
  process.exit(1);
});
