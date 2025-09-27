/**
 * E2E Frame rate stability tests (ASCII-only)
 * - Collect high-precision frame data for stability gates
 * - Budgets: P95 FPS and frame-drop rate
 * - Scenarios: idle, animation, interaction, stress
 */

import { test, expect } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { launchAppWithPage } from '../helpers/launch';
import fs from 'fs';
import path from 'path';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  const { app, page: launchedPage } = await launchAppWithPage();
  electronApp = app;
  page = launchedPage;
  await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 });
});

test.afterAll(async () => {
  await electronApp.close();
});

/**
 * Collect frame timings in the renderer for a duration.
 */
async function collectFramerateData(
  durationMs: number,
  description: string,
  setupFn?: () => Promise<void>
): Promise<number[]> {
  console.log(`[INFO] Collect frame data: ${description} (${durationMs}ms)`);

  if (setupFn) await setupFn();

  const frameTimes = await page.evaluate(async duration => {
    return new Promise<number[]>(resolve => {
      const samples: number[] = [];
      let last = performance.now();
      const start = last;

      function step() {
        const now = performance.now();
        const dt = now - last;
        // Skip the very first frame window (avoid bias)
        if (samples.length > 0 || now - start > 50) samples.push(dt);
        last = now;
        if (now - start < duration) requestAnimationFrame(step);
        else resolve(samples);
      }

      requestAnimationFrame(step);
    });
  }, durationMs);

  const avg =
    frameTimes.reduce((a, b) => a + b, 0) / Math.max(1, frameTimes.length);
  console.log(
    `   collected ${frameTimes.length} frames, avg fps: ${(1000 / avg).toFixed(1)}fps`
  );
  return frameTimes;
}

test.describe('Frame stability data collection', () => {
  test('Baseline FPS - idle', async () => {
    await page.waitForTimeout(1000);
    const frameTimes = await collectFramerateData(2000, 'idle baseline');

    expect(frameTimes.length).toBeGreaterThan(60);
    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    expect(avg).toBeLessThan(50); // >20fps
    expect(avg).toBeGreaterThan(5); // <200fps

    await page.evaluate(data => {
      type G = typeof globalThis & {
        framerateData?: {
          baseline?: number[];
          animation?: number[];
          interaction?: number[];
          stress?: number[];
          __perfStressRAF?: number;
        };
      };
      (globalThis as G).framerateData = (globalThis as G).framerateData || {};
      (globalThis as G).framerateData!.baseline = data;
    }, frameTimes);
  });

  test('Animation scenario', async () => {
    const trigger = page
      .locator(
        '[data-testid="animation-trigger"], [data-testid="play-button"], button'
      )
      .first();

    const frameTimes = await collectFramerateData(
      3000,
      'animation',
      async () => {
        if ((await trigger.count()) > 0) {
          await trigger.click();
          await page.waitForTimeout(200);
        }
      }
    );

    expect(frameTimes.length).toBeGreaterThan(100);

    await page.evaluate(data => {
      type G = typeof globalThis & {
        framerateData?: {
          baseline?: number[];
          animation?: number[];
          interaction?: number[];
          stress?: number[];
          __perfStressRAF?: number;
        };
      };
      (globalThis as G).framerateData = (globalThis as G).framerateData || {};
      (globalThis as G).framerateData!.animation = data;
    }, frameTimes);
  });

  test('Interaction scenario', async () => {
    const frameTimes = await collectFramerateData(
      2000,
      'interaction',
      async () => {
        // Move cursor in a simple pattern
        for (let i = 0; i < 5; i++) {
          await page.mouse.move(100 + i * 80, 120 + i * 20, { steps: 6 });
          await page.waitForTimeout(50);
        }
        await page.mouse.click(150, 150);
      }
    );

    expect(frameTimes.length).toBeGreaterThan(60);

    await page.evaluate(data => {
      type G = typeof globalThis & {
        framerateData?: {
          baseline?: number[];
          animation?: number[];
          interaction?: number[];
          stress?: number[];
          __perfStressRAF?: number;
        };
      };
      (globalThis as G).framerateData = (globalThis as G).framerateData || {};
      (globalThis as G).framerateData!.interaction = data;
    }, frameTimes);
  });

  test('Stress scenario', async () => {
    const frameTimes = await collectFramerateData(2000, 'stress', async () => {
      await page.evaluate(() => {
        const root = document.createElement('div');
        root.id = 'perf-stress-root';
        root.style.position = 'fixed';
        root.style.left = '0';
        root.style.top = '0';
        root.style.pointerEvents = 'none';
        document.body.appendChild(root);

        for (let i = 0; i < 100; i++) {
          const el = document.createElement('div');
          el.className = 'perf-stress-item';
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.position = 'absolute';
          el.style.left = `${(i % 20) * 22}px`;
          el.style.top = `${Math.floor(i / 20) * 22}px`;
          el.style.background = i % 2 === 0 ? '#4e79a7' : '#f28e2b';
          root.appendChild(el);
        }

        let _t0 = performance.now();
        function animate() {
          const t = performance.now();
          _t0 = t;
          const items = document.querySelectorAll('.perf-stress-item');
          let i = 0;
          items.forEach(el => {
            const x = (i % 20) * 22 + Math.sin(t / 200 + i) * 5;
            const y = Math.floor(i / 20) * 22 + Math.cos(t / 180 + i) * 5;
            (el as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
            i++;
          });
          (window as unknown as { __perfStressRAF?: number }).__perfStressRAF =
            requestAnimationFrame(animate);
        }
        (window as unknown as { __perfStressRAF?: number }).__perfStressRAF =
          requestAnimationFrame(animate);
      });

      await page.waitForTimeout(100);
    });

    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    expect(avg).toBeLessThan(100); // >10fps

    await page.evaluate(() => {
      cancelAnimationFrame(
        (window as unknown as { __perfStressRAF?: number }).__perfStressRAF!
      );
      const root = document.getElementById('perf-stress-root');
      root?.remove();
    });

    await page.evaluate(data => {
      type G = typeof globalThis & {
        framerateData?: {
          baseline?: number[];
          animation?: number[];
          interaction?: number[];
          stress?: number[];
          __perfStressRAF?: number;
        };
      };
      (globalThis as G).framerateData = (globalThis as G).framerateData || {};
      (globalThis as G).framerateData!.stress = data;
    }, frameTimes);
  });
});

test.describe('Aggregate and export frame report', () => {
  test('Collect all scenarios', async () => {
    const data = await page.evaluate(() => {
      type G = typeof globalThis & {
        framerateData?: {
          baseline?: number[];
          animation?: number[];
          interaction?: number[];
          stress?: number[];
        };
      };
      return (globalThis as G).framerateData || {};
    });

    const scenarios: Record<string, number[]> = {
      baseline: data.baseline || [],
      animation: data.animation || [],
      interaction: data.interaction || [],
      stress: data.stress || [],
    };

    const allFrameTimes = [
      ...scenarios.baseline,
      ...scenarios.animation,
      ...scenarios.interaction,
      ...scenarios.stress,
    ];

    expect(allFrameTimes.length).toBeGreaterThan(200);

    const p95 = (arr: number[]) => {
      const a = [...arr].sort((x, y) => x - y);
      return a[Math.ceil(a.length * 0.95) - 1];
    };

    const avgFrameTime =
      allFrameTimes.reduce((a, b) => a + b, 0) / allFrameTimes.length;
    const p95FrameTime = p95(allFrameTimes);
    const dropRate =
      (allFrameTimes.filter(v => v > 33.33).length / allFrameTimes.length) *
      100;

    const report = {
      generatedAt: new Date().toISOString(),
      statistics: {
        sampleCount: allFrameTimes.length,
        avgFPS: 1000 / avgFrameTime,
        p95FPS: 1000 / p95FrameTime,
        frameDropRate: dropRate,
      },
      scenarios: Object.fromEntries(
        Object.entries(scenarios).map(([k, v]) => [k, { frames: v.length }])
      ),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    const reportDir = path.resolve(
      process.cwd(),
      'tests',
      'artifacts',
      'frames'
    );
    fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    const rootReportPath = path.resolve(process.cwd(), 'frame-report.json');
    fs.writeFileSync(rootReportPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`[REPORT] Frame report generated:`);
    console.log(`   detail: ${reportPath}`);
    console.log(`   quick:  ${rootReportPath}`);
    console.log(`[REPORT] Summary:`);
    console.log(`   samples: ${report.statistics.sampleCount}`);
    console.log(`   avgFPS: ${report.statistics.avgFPS.toFixed(1)}`);
    console.log(`   p95FPS: ${report.statistics.p95FPS.toFixed(1)}`);
    console.log(`   dropRate: ${report.statistics.frameDropRate.toFixed(2)}%`);

    // Quality gates (light)
    expect(report.statistics.avgFPS).toBeGreaterThan(10);
    expect(report.statistics.p95FPS).toBeGreaterThan(5);
    expect(report.statistics.frameDropRate).toBeLessThan(50);
  });
});

test.describe('Frame stability regression', () => {
  test('Compare with historical baseline', async () => {
    const reportDir = path.resolve(
      process.cwd(),
      'tests',
      'artifacts',
      'frames'
    );
    const reportPath = path.join(reportDir, 'report.json');
    const baselinePath = path.join(reportDir, 'baseline.json');

    if (fs.existsSync(reportPath) && fs.existsSync(baselinePath)) {
      const current = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      const currentP95 = current.statistics.p95FPS as number;
      const baseP95 = baseline.statistics.p95FPS as number;
      const regression = ((baseP95 - currentP95) / baseP95) * 100;

      console.log(`[ANALYZE] FPS regression analysis:`);
      console.log(`   current P95 FPS: ${currentP95.toFixed(1)}`);
      console.log(`   baseline P95 FPS: ${baseP95.toFixed(1)}`);
      console.log(`   regression: ${regression.toFixed(1)}%`);

      // Allow 10% regression by default
      expect(regression).toBeLessThanOrEqual(10);
    } else if (fs.existsSync(reportPath) && !fs.existsSync(baselinePath)) {
      // Optionally seed baseline when allowed
      const allowSeed = process.env.SEED_FPS_BASELINE === '1';
      if (allowSeed) {
        fs.copyFileSync(reportPath, baselinePath);
        console.log(`[INFO] Baseline report created: ${baselinePath}`);
      } else {
        console.log('[INFO] Baseline file missing, skip regression test');
      }
    } else {
      console.log('[INFO] Report missing; skip regression comparison');
    }
  });
});
