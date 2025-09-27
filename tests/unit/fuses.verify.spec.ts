import { describe, it, expect, vi } from 'vitest';

// Import CommonJS module from scripts
async function importFuses() {
  const mod: any = await import('../../scripts/fuses.js');
  return mod;
}

describe('scripts/fuses verifyFusesConfigWith (DI)', () => {
  it('verifies production fuses when values match (no exit)', async () => {
    const f = await importFuses();
    const cfg = f.PRODUCTION_FUSES_CONFIG;
    const readMock = vi.fn().mockResolvedValue({
      runAsNode: cfg.runAsNode,
      enableNodeOptionsEnvironmentVariable: cfg.enableNodeOptionsEnvironmentVariable,
      onlyLoadAppFromAsar: cfg.onlyLoadAppFromAsar,
      enableEmbeddedAsarIntegrityValidation: cfg.enableEmbeddedAsarIntegrityValidation,
    });
    const exitMock = vi.fn(() => {
      throw new Error('exit should not be called');
    });

    const result = await f.verifyFusesConfigWith('dummy-electron.exe', cfg, {
      readFusesFn: readMock,
      exitFn: exitMock,
    });
    expect(result.ok).toBe(true);
    expect(result.mismatches.length).toBe(0);
    expect(readMock).toHaveBeenCalledTimes(1);
    expect(exitMock).not.toHaveBeenCalled();
  });

  it('fails verification when any critical fuse mismatches (calls exit)', async () => {
    const f = await importFuses();
    const cfg = f.PRODUCTION_FUSES_CONFIG;
    const readMock = vi.fn().mockResolvedValue({
      runAsNode: !cfg.runAsNode, // mismatch on purpose
      enableNodeOptionsEnvironmentVariable: cfg.enableNodeOptionsEnvironmentVariable,
      onlyLoadAppFromAsar: cfg.onlyLoadAppFromAsar,
      enableEmbeddedAsarIntegrityValidation: cfg.enableEmbeddedAsarIntegrityValidation,
    });
    const exitMock = vi.fn(() => {
      throw new Error('process.exit called');
    });

    await expect(
      f.verifyFusesConfigWith('dummy-electron.exe', cfg, {
        readFusesFn: readMock,
        exitFn: exitMock,
      })
    ).rejects.toThrow('process.exit called');
    expect(readMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
