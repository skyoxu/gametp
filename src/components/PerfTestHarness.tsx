import React, {
  useCallback,
  useRef,
  useState,
  useTransition,
  useLayoutEffect,
} from 'react';
import { createComputationWorker } from '@/shared/workers/workerBridge';

export default function PerfTestHarness() {
  const e2eSmoke = (import.meta as any)?.env?.VITE_E2E_SMOKE === 'true';
  console.log(`[PerfTestHarness] e2eSmoke=${e2eSmoke}`);
  const [responded, setResponded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const workerRef = useRef<ReturnType<typeof createComputationWorker> | null>(
    null
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const ensureWorker = () => {
    if (!workerRef.current) workerRef.current = createComputationWorker();
    return workerRef.current!;
  };

  const onClick = useCallback(async () => {
    const t0 = performance.now();
    performance.mark('test_button_click_start');

    setResponded(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (e2eSmoke) {
      timerRef.current = setTimeout(() => {
        setResponded(false);
        timerRef.current = null;
      }, 60);
      const t1 = performance.now();
      console.log(`[PerfTestHarness] smoke-mode handler time=${(t1 - t0).toFixed(2)}ms`);
      return;
    }

    setBusy(true);

    const { heavyTask } = ensureWorker();
    try {
      const res = await heavyTask(5_000_00);
      console.log(
        `[PerfTestHarness] worker heavyTask duration=${res.duration.toFixed(2)}ms`
      );
    } catch (e) {
      console.warn('[PerfTestHarness] worker error', e);
    } finally {
      setBusy(false);
      const t1 = performance.now();
      console.log(
        `[PerfTestHarness] total handler time=${(t1 - t0).toFixed(2)}ms`
      );
    }
  }, []);

  // Manage response indicator visibility and auto-hide
  useLayoutEffect(() => {
    if (!responded) {
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }

    performance.mark('response_indicator_visible');
    performance.measure(
      'click_to_indicator',
      'test_button_click_start',
      'response_indicator_visible'
    );

    const measure = performance.getEntriesByName('click_to_indicator').pop();
    if (measure) {
      console.log(
        `[PerfTestHarness] click_to_indicator=${measure.duration.toFixed(2)}ms`
      );
    }

    if (!e2eSmoke) {
      timerRef.current = setTimeout(() => {
        setResponded(false);
        timerRef.current = null;
      }, 120);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [responded, e2eSmoke]);

  return (
    <div className="mt-6 flex items-center gap-3" data-testid="perf-harness">
      <button
        data-testid="test-button"
        className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white"
        onClick={onClick}
        disabled={busy}
      >
        {busy ? 'Workingâ€? : 'Test Interaction'}
      </button>
      {responded && (
        <span data-testid="response-indicator" className="text-green-400">
          OK
        </span>
      )}
      {isPending && <span className="text-yellow-400">â€?/span>}
    </div>
  );
}
