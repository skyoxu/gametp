import { useEffect, useRef } from 'react';

/**
 * Preload eventLoopDelay /CI
 * - window.api.perf.eventLoopDelay src/preload/bridge.ts
 * - 5
 */
export function useEventLoopDelayMonitor(intervalMs: number = 5000) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const api: any = (window as any).api;
    if (!api?.perf?.eventLoopDelay) return;

    const tick = async () => {
      try {
        const s = await api.perf.eventLoopDelay();
        // perf_hooks
        const toMs = (n: number) => Math.round((n / 1_000_000) * 10) / 10;
        // /CI
        if (process?.env?.NODE_ENV === 'test' || process?.env?.CI === 'true') {
          console.log('[eld]', {
            min: toMs(s.min),
            max: toMs(s.max),
            mean: toMs(s.mean),
            p50: toMs(s.percentiles.p50),
            p90: toMs(s.percentiles.p90),
            p99: toMs(s.percentiles.p99),
            exceeds50ms: s.exceeds50ms,
          });
        }
      } catch {}
    };

    timerRef.current = window.setInterval(tick, intervalMs);
    // Note
    void tick();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [intervalMs]);
}
