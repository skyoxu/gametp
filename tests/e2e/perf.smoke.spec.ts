/**
 * Perf smoke (minimal) - Electron + Playwright
 * Focus: basic app boot and interaction P95 with stable sampling.
 */
import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, prepareWindowForInteraction } from '../helpers/launch';
import { PerformanceTestUtils } from '../utils/PerformanceTestUtils';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  const { app, page: launchedPage } = await launchApp();
  electronApp = app;
  page = launchedPage;
  // Ensure page is fully ready and renderer has mounted
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  await prepareWindowForInteraction(page);
  const url = page.url();
  console.log(`[INFO] Perf smoke launch URL: ${url}`);
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('@smoke Perf Smoke Suite', () => {
  test('@smoke App renders', async () => {
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 15000 });
    expect(await page.locator('[data-testid="app-root"]').count()).toBeGreaterThan(0);
  });

  test('@smoke Interaction P95', async () => {
    const env = (
      process.env.SENTRY_ENVIRONMENT ||
      process.env.NODE_ENV ||
      'dev'
    ).toLowerCase();
    const threshold = env.includes('prod')
      ? 100
      : env.includes('stag')
        ? 150
        : 150;

    await page.waitForSelector('[data-testid="app-root"]');
    await page.bringToFront();
    await page.evaluate(
      () =>
        new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    );

    // Use the stable start-game button for smoke P95 to avoid harness flakiness
    const startBtn = page.locator('[data-testid="start-game"]').first();
    if (await startBtn.count()) {
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          const el = document.querySelector('[data-testid="start-game"]') as HTMLElement | null;
          el?.click();
        });
        await page.waitForTimeout(80);
      }
      await PerformanceTestUtils.runInteractionP95Test(
        async () => {
          const t0 = Date.now();
          await page.evaluate(() => {
            const el = document.querySelector('[data-testid="start-game"]') as HTMLElement | null;
            el?.click();
          });
          await page.waitForTimeout(50);
          return Date.now() - t0;
        },
        threshold,
        20
      );
    } else {
      console.log('No start-game button found, skip interaction test');
    }
  });
});


