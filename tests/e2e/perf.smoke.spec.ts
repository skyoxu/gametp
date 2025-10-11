/**
 * Perf smoke (minimal) - Electron + Playwright
 * Focus: basic app boot and interaction P95 with stable sampling.
 */
import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, prepareWindowForInteraction } from '../helpers/launch';
import { PerformanceTestUtils } from '../utils/PerformanceTestUtils';

const APP_ROOT_SELECTOR = '[data-testid="app-root"]';
const START_GAME_SELECTOR = '[data-testid="start-game"]';

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
    const appRoot = page.locator(APP_ROOT_SELECTOR);
    await appRoot.first().waitFor({ timeout: 15000 });
    const rootCount = await appRoot.count();
    expect(rootCount).toBeGreaterThan(0);
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

    await page.waitForSelector(APP_ROOT_SELECTOR);
    await page.bringToFront();
    await page.evaluate(
      () =>
        new Promise(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        )
    );

    const startButton = page.locator(START_GAME_SELECTOR).first();
    if (await startButton.count()) {
      for (let i = 0; i < 3; i++) {
        await startButton.click({ delay: 10 });
        await page.waitForTimeout(80);
      }
      await PerformanceTestUtils.runInteractionP95Test(
        async () => {
          const t0 = Date.now();
          await page.click(START_GAME_SELECTOR, { timeout: 5000 });
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
