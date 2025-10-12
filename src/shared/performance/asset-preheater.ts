/**\n * Asset preheater (idle-time, frame-friendly):\n * - Run lightweight preheat tasks during idle/next rAF to avoid jank\n * - Useful to pre-warm small, critical resources before game starts,\n *   without pulling in Phaser loaders\n */

export interface PreheatTask {
  run: () => Promise<void> | void;
  label?: string;
}

function nextIdle(): Promise<void> {
  if (typeof (window as any).requestIdleCallback === 'function') {
    return new Promise(resolve =>
      (window as any).requestIdleCallback(() => resolve())
    );
  }
  return new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function runPreheatQueue(tasks: PreheatTask[], budgetMs = 12) {
  for (const t of tasks) {
    const start = performance.now();
    await t.run();
    const spent = performance.now() - start;
    // If this task exceeds the budget, yield to idle before continuing
    if (spent > budgetMs) {
      await nextIdle();
    }
  }
}

/**
 * Example: image preheat (effective only when resources exist)
 */
export function preheatImages(urls: string[]): PreheatTask[] {
  return urls.map(u => ({
    label: `img:${u}`,
    run: () =>
      new Promise<void>(resolve => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = u;
      }),
  }));
}
