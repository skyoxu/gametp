/**
 * requestIdleCallback rAF setTimeout(0)
 */

export type IdleHandle = { cancel: () => void };

type IdleDeadline = { timeRemaining: () => number; didTimeout?: boolean };

export function scheduleIdle(
  task: () => void,
  timeoutMs: number = 50
): IdleHandle {
  const g: any = typeof window !== 'undefined' ? window : globalThis;
  if (typeof g.requestIdleCallback === 'function') {
    const h = g.requestIdleCallback(
      (_deadline: IdleDeadline) => {
        try {
          task();
        } catch {
          /* noop */
        }
      },
      { timeout: timeoutMs }
    );
    return { cancel: () => g.cancelIdleCallback?.(h) };
  }

  let cancelled = false;
  const id =
    g.requestAnimationFrame?.(() =>
      g.requestAnimationFrame?.(() => {
        if (!cancelled) task();
      })
    ) ??
    g.setTimeout?.(() => {
      if (!cancelled) task();
    }, 0);
  return {
    cancel: () => {
      cancelled = true;
      try {
        g.cancelAnimationFrame?.(id);
      } catch {
        /* noop */
      }
    },
  };
}

export function scheduleNextFrame(task: () => void): IdleHandle {
  const g: any = typeof window !== 'undefined' ? window : globalThis;
  let cancelled = false;
  const id =
    g.requestAnimationFrame?.(() =>
      g.requestAnimationFrame?.(() => {
        if (!cancelled) task();
      })
    ) ??
    g.setTimeout?.(() => {
      if (!cancelled) task();
    }, 0);
  return {
    cancel: () => {
      cancelled = true;
      try {
        g.cancelAnimationFrame?.(id);
      } catch {
        /* noop */
      }
    },
  };
}

export function scheduleNonBlocking(
  task: () => void,
  opts?: { idleTimeoutMs?: number }
): IdleHandle {
  return scheduleIdle(task, opts?.idleTimeoutMs ?? 50);
}
