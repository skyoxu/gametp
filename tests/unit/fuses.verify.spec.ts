import { describe, it, expect, vi } from 'vitest';

import type { FuseEvaluationResult } from '../../scripts/fuses.js';

async function importFuses(): Promise<typeof import('../../scripts/fuses.js')> {
  return (await import(
    '../../scripts/fuses.js'
  )) as typeof import('../../scripts/fuses.js');
}

describe('scripts/fuses verifyFusesConfigWith (DI)', () => {
  it('verifies production fuses when values match (no exit)', async () => {
    const f = await importFuses();
    const cfg = f.PRODUCTION_FUSES_CONFIG;
    const readMock = vi.fn(async () => ({
      runAsNode: cfg.runAsNode,
      enableNodeOptionsEnvironmentVariable:
        cfg.enableNodeOptionsEnvironmentVariable,
      onlyLoadAppFromAsar: cfg.onlyLoadAppFromAsar,
      enableEmbeddedAsarIntegrityValidation:
        cfg.enableEmbeddedAsarIntegrityValidation,
    }));
    const exitMock = vi.fn((code: number): never => {
      throw new Error(`process.exit(${code}) should not be called`);
    });

    const result: FuseEvaluationResult = await f.verifyFusesConfigWith(
      'dummy-electron.exe',
      cfg,
      {
        readFusesFn: readMock,
        exitFn: exitMock,
      }
    );
    expect(result.ok).toBe(true);
    expect(result.mismatches.length).toBe(0);
    expect(readMock).toHaveBeenCalledTimes(1);
    expect(exitMock).not.toHaveBeenCalled();
  });

  it('fails verification when any critical fuse mismatches (calls exit)', async () => {
    const f = await importFuses();
    const cfg = f.PRODUCTION_FUSES_CONFIG;
    const readMock = vi.fn(async () => ({
      runAsNode: !cfg.runAsNode, // mismatch on purpose
      enableNodeOptionsEnvironmentVariable:
        cfg.enableNodeOptionsEnvironmentVariable,
      onlyLoadAppFromAsar: cfg.onlyLoadAppFromAsar,
      enableEmbeddedAsarIntegrityValidation:
        cfg.enableEmbeddedAsarIntegrityValidation,
    }));
    const exitMock = vi.fn((code: number): never => {
      throw new Error(`process.exit(${code}) called`);
    });

    await expect(
      f.verifyFusesConfigWith('dummy-electron.exe', cfg, {
        readFusesFn: readMock,
        exitFn: exitMock,
      })
    ).rejects.toThrow('process.exit(1) called');
    expect(readMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
