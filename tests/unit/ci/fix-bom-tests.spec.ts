import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function runNode(
  script: string,
  env: Record<string, string>,
  cwd: string
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

describe('fix-bom-tests script', () => {
  it('removes BOM from files under tests/ when CI=true', async () => {
    const base = mkdtempSync(join(tmpdir(), 'fix-bom-'));
    const testsDir = join(base, 'tests');
    mkdirSync(testsDir);
    const f = join(testsDir, 'bom.js');
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const body = Buffer.from("console.log('ok');\n", 'utf8');
    writeFileSync(f, Buffer.concat([bom, body]));

    const res = await runNode(
      join(process.cwd(), 'scripts/ci/fix-bom-tests.mjs'),
      { CI: 'true' },
      base
    );
    expect(res.code).toBe(0);
    const buf = readFileSync(f);
    // Check no BOM
    expect(
      !(
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf
      )
    ).toBe(true);
    rmSync(base, { recursive: true, force: true });
  });
});
