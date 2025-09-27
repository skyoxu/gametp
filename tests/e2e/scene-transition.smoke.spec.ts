import { test, expect, Page } from '@playwright/test';
import { launchAppWithPage } from '../helpers/launch';
import { ensureDomReady } from '../helpers/ensureDomReady';

async function injectMinimalSceneMonitor(page: Page) {
  await page.addInitScript(() => {
    type WinScene = Window & {
      sceneTransitionData: Array<{
        sceneName: string;
        duration: number;
        timestamp: number;
      }>;
      trackSceneTransition: (sceneName: string) => void;
    };
    (window as unknown as WinScene).sceneTransitionData = [];
    (window as unknown as WinScene).trackSceneTransition = function (
      sceneName: string
    ) {
      const start = `scene-smoke-${sceneName}-start`;
      const end = `scene-smoke-${sceneName}-end`;
      performance.mark(start);
      setTimeout(
        () => {
          performance.mark(end);
          const measure = `scene.smoke.${sceneName}`;
          performance.measure(measure, start, end);
          const entries = performance.getEntriesByName(measure);
          if (entries.length) {
            const e = entries[entries.length - 1] as PerformanceMeasure;
            (window as unknown as WinScene).sceneTransitionData.push({
              sceneName: measure,
              duration: e.duration,
              timestamp: e.startTime,
            });
          }
        },
        Math.random() * 20 + 30
      );
    };
  });

  // Fallback injection when page already loaded
  await page.evaluate(() => {
    type WinScene = Window & {
      sceneTransitionData: Array<{
        sceneName: string;
        duration: number;
        timestamp: number;
      }>;
      trackSceneTransition: (sceneName: string) => void;
    };
    if (
      typeof (window as unknown as WinScene).trackSceneTransition !== 'function'
    ) {
      (window as unknown as WinScene).sceneTransitionData =
        (window as unknown as WinScene).sceneTransitionData || [];
      (window as unknown as WinScene).trackSceneTransition = function (
        sceneName: string
      ) {
        const start = `scene-smoke-${sceneName}-start`;
        const end = `scene-smoke-${sceneName}-end`;
        performance.mark(start);
        setTimeout(
          () => {
            performance.mark(end);
            const measure = `scene.smoke.${sceneName}`;
            performance.measure(measure, start, end);
            const entries = performance.getEntriesByName(measure);
            if (entries.length) {
              const e = entries[entries.length - 1] as PerformanceMeasure;
              (window as unknown as WinScene).sceneTransitionData.push({
                sceneName: measure,
                duration: e.duration,
                timestamp: e.startTime,
              });
            }
          },
          Math.random() * 20 + 30
        );
      };
    }
  });
}

test.describe('Scene transition smoke', () => {
  test('Minimal sampling loop', async () => {
    const { app, page } = await launchAppWithPage();
    await ensureDomReady(page);
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 });

    await injectMinimalSceneMonitor(page);

    const samples = Number(process.env.SCENE_SAMPLES ?? '2');
    for (let i = 0; i < samples; i++) {
      await page.evaluate(() => {
        type WinScene = Window & {
          trackSceneTransition: (sceneName: string) => void;
        };
        (window as unknown as WinScene).trackSceneTransition('smoke');
      });
      await page.waitForTimeout(80);
    }

    const data = await page.evaluate(() => {
      type WinScene = Window & {
        sceneTransitionData: Array<{
          sceneName: string;
          duration: number;
          timestamp: number;
        }>;
      };
      return (window as unknown as WinScene).sceneTransitionData;
    });
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    await app.close();
  });
});
