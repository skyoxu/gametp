import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function runNode(
  script: string,
  env: Record<string, string>,
  cwd?: string
): Promise<{ code: number; out: string; err: string }> {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [script], {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
    });
    let out = '';
    let err = '';
    child.stdout.on('data', d => (out += d.toString()));
    child.stderr.on('data', d => (err += d.toString()));
    child.on('close', code => resolve({ code: code ?? -1, out, err }));
  });
}

describe('ASCII gate for tests', () => {
  it('warns (exit 0) when CI=false and non-ASCII exists', async () => {
    const base = mkdtempSync(join(tmpdir(), 'ascii-gate-'));
    const scope = join(base, 'tests-scope');
    // Create scope dir and files
    require('node:fs').mkdirSync(scope);
    writeFileSync(join(scope, 'a.ts'), 'const a = 1;\n', 'utf8');
    // Intentionally write a file that contains non-ASCII via unicode escapes (file stays ASCII)
    writeFileSync(join(scope, 'b.ts'), "const s = '中文';\n", 'utf8');

    const res = await runNode('scripts/ci/guard-tests-ascii.mjs', {
      CI: 'false',
      TESTS_ASCII_SCOPE: scope,
    });
    expect(res.code).toBe(0);
    rmSync(base, { recursive: true, force: true });
  });

  it('fails (exit 1) when CI=true and non-ASCII exists', async () => {
    const base = mkdtempSync(join(tmpdir(), 'ascii-gate-'));
    const scope = join(base, 'tests-scope');
    require('node:fs').mkdirSync(scope);
    writeFileSync(join(scope, 'b.ts'), "const s = '中文';\n", 'utf8');

    const res = await runNode('scripts/ci/guard-tests-ascii.mjs', {
      CI: 'true',
      TESTS_ASCII_SCOPE: scope,
    });
    expect(res.code).toBe(1);
    rmSync(base, { recursive: true, force: true });
  });
});
