import { describe, it, expect } from 'vitest';

// Import CJS with ESM dynamic import
async function importFuses() {
  const mod: any = await import('../../scripts/fuses.js');
  return mod;
}

describe('scripts/fuses evaluateFuses (pure)', () => {
  it('returns ok=true when all critical fuses match', async () => {
    const f = await importFuses();
    const cfg = f.PRODUCTION_FUSES_CONFIG;
    const actual = {
      runAsNode: cfg.runAsNode,
      enableNodeOptionsEnvironmentVariable: cfg.enableNodeOptionsEnvironmentVariable,
      onlyLoadAppFromAsar: cfg.onlyLoadAppFromAsar,
      enableEmbeddedAsarIntegrityValidation: cfg.enableEmbeddedAsarIntegrityValidation,
    };
    const verdict = f.evaluateFuses(actual, cfg);
    expect(verdict.ok).toBe(true);
    expect(verdict.mismatches.length).toBe(0);
  });

  it('returns ok=false and lists mismatches when any fuse differs', async () => {
    const f = await importFuses();
    const cfg = f.PRODUCTION_FUSES_CONFIG;
    const actual = {
      runAsNode: !cfg.runAsNode, // force mismatch
      enableNodeOptionsEnvironmentVariable: cfg.enableNodeOptionsEnvironmentVariable,
      onlyLoadAppFromAsar: cfg.onlyLoadAppFromAsar,
      enableEmbeddedAsarIntegrityValidation: cfg.enableEmbeddedAsarIntegrityValidation,
    };
    const verdict = f.evaluateFuses(actual, cfg);
    expect(verdict.ok).toBe(false);
    expect(verdict.mismatches.find(m => m.key === 'runAsNode')).toBeTruthy();
  });
});

