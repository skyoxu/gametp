import { describe, it, expect } from 'vitest';

import type { FusesConfig, FuseEvaluationResult } from '../../scripts/fuses.js';

async function importFuses(): Promise<typeof import('../../scripts/fuses.js')> {
  return (await import(
    '../../scripts/fuses.js'
  )) as typeof import('../../scripts/fuses.js');
}

describe('scripts/fuses evaluateFuses (pure)', () => {
  it('returns ok=true when all critical fuses match', async () => {
    const f = await importFuses();
    const cfg = f.PRODUCTION_FUSES_CONFIG;
    const actual: Partial<FusesConfig> = {
      runAsNode: cfg.runAsNode,
      enableNodeOptionsEnvironmentVariable:
        cfg.enableNodeOptionsEnvironmentVariable,
      onlyLoadAppFromAsar: cfg.onlyLoadAppFromAsar,
      enableEmbeddedAsarIntegrityValidation:
        cfg.enableEmbeddedAsarIntegrityValidation,
    };
    const verdict: FuseEvaluationResult = f.evaluateFuses(actual, cfg);
    expect(verdict.ok).toBe(true);
    expect(verdict.mismatches.length).toBe(0);
  });

  it('returns ok=false and lists mismatches when any fuse differs', async () => {
    const f = await importFuses();
    const cfg = f.PRODUCTION_FUSES_CONFIG;
    const actual: Partial<FusesConfig> = {
      runAsNode: !cfg.runAsNode, // force mismatch
      enableNodeOptionsEnvironmentVariable:
        cfg.enableNodeOptionsEnvironmentVariable,
      onlyLoadAppFromAsar: cfg.onlyLoadAppFromAsar,
      enableEmbeddedAsarIntegrityValidation:
        cfg.enableEmbeddedAsarIntegrityValidation,
    };
    const verdict: FuseEvaluationResult = f.evaluateFuses(actual, cfg);
    expect(verdict.ok).toBe(false);
    expect(verdict.mismatches.find(m => m.key === 'runAsNode')).toBeTruthy();
  });
});
