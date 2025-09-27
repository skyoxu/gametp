import { describe, it, expect } from 'vitest';
import { GATES } from '../../src/shared/quality/gates';

describe('01 SLO\u2192\u95e8\u7981\u6620\u5c04', () => {
  it('\u5305\u542b\u4e09\u7c7b\u95e8\u7981\u5e76\u6ee1\u8db3\u9608\u503c\u4e0b\u9650', () => {
    const byKey = Object.fromEntries(GATES.map(g => [g.key, g]));
    expect(byKey.crash_free.threshold).toBeGreaterThanOrEqual(99.5);
    expect(byKey.tp95.threshold).toBeLessThanOrEqual(100);
    expect(byKey.coverage.threshold).toBeGreaterThanOrEqual(90);
  });
});
