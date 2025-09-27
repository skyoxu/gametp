import { describe, it, expect } from 'vitest';
import { measureEventLoopLag } from '../../scripts/benchmarks/event-loop-latency';

describe('09 EventLoop \u5ef6\u8fdf', () => {
  it('TP95/P99 \u5728\u57fa\u7ebf\u8303\u56f4\u5185\uff08\u5f00\u53d1\u673a\uff09', async () => {
    const s = await measureEventLoopLag(200); //
    expect(s.p95).toBeLessThanOrEqual(50); //
    expect(s.p99).toBeLessThanOrEqual(150);
  }, 30000); // 30s
});
