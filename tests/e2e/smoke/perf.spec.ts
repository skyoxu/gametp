/**
 * Perf smoke (minimal) - Electron + Playwright
 * Focus: basic app boot and interaction P95 with stable sampling.
 */
import { expect, Page, ElectronApplication, test } from '@playwright/test';
import { launchApp, prepareWindowForInteraction } from '../../helpers/launch';
import { PerformanceTestUtils } from '../../utils/PerformanceTestUtils';

const APP_ROOT_SELECTOR = '[data-testid="app-root"]';
const START_BUTTON_SELECTOR = '[data-testid="start-game"]';
const PERF_BUTTON_SELECTOR = '[data-testid="test-button"]';
const RESPONSE_INDICATOR_SELECTOR = '[data-testid="response-indicator"]';

let electronApp: ElectronApplication;
let page: Page;

function resolveThreshold(environmentName: string): number {
  if (environmentName.includes('prod')) return 100;
  if (environmentName.includes('stag')) return 150;
  return 200;
}

async function waitForAnimationSettled(targetPage: Page): Promise<void> {
  await targetPage.evaluate(
    () =>
      new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
}

async function warmUpInteraction(
  target: ReturnType<Page['locator']>
): Promise<void> {
  for (let i = 0; i < 3; i++) {
    try {
      await expect(target).toBeEnabled({ timeout: 2_000 });
      await target.click({ delay: 10 });
      await waitForAnimationSettled(target.page());
    } catch (error) {
      console.warn('[warmUpInteraction] skip warmup click', error);
      return;
    }
  }
}

test.beforeAll(async () => {
  const launched = await launchApp();
  electronApp = launched.app;
  page = launched.page;

  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
  await prepareWindowForInteraction(page);

  const url = page.url();
  expect(url.startsWith('app://')).toBeTruthy();
  expect(url.startsWith('chrome-error://')).toBeFalsy();
  console.log(`[INFO] Perf smoke URL: ${url}`);
});

test.afterAll(async () => {
  await electronApp?.close();
});

test.describe('@smoke Perf Smoke Suite', () => {
  test('@smoke App renders', async () => {
    const appRoot = page.locator(APP_ROOT_SELECTOR);
    await appRoot.first().waitFor({ timeout: 15_000 });
    expect(await appRoot.count()).toBeGreaterThan(0);
  });

  test('@smoke Interaction P95', async () => {
    const environmentLabel = (
      process.env.SENTRY_ENVIRONMENT ||
      process.env.NODE_ENV ||
      'dev'
    ).toLowerCase();
    const threshold = resolveThreshold(environmentLabel);

    await page.waitForSelector(APP_ROOT_SELECTOR);
    await page.bringToFront();
    await waitForAnimationSettled(page);

    await page
      .waitForSelector(PERF_BUTTON_SELECTOR, { timeout: 10_000 })
      .catch(() => null);

    const startButton = page.locator(START_BUTTON_SELECTOR).first();
    const perfButton = page.locator(PERF_BUTTON_SELECTOR).first();
    await perfButton
      .waitFor({ state: 'attached', timeout: 10_000 })
      .catch(() => null);
    const preferredButton =
      (await perfButton.count()) > 0 ? perfButton : startButton;

    await preferredButton.waitFor({ state: 'visible', timeout: 12_000 });
    await expect(preferredButton).toBeEnabled({ timeout: 5_000 });
    await warmUpInteraction(preferredButton);

    await PerformanceTestUtils.runInteractionP95Test(
      async () => {
        await waitForAnimationSettled(page);
        const t0 = Date.now();
        await preferredButton.click({ timeout: 5_000 });

        if ((await perfButton.count()) > 0) {
          await page.waitForSelector(RESPONSE_INDICATOR_SELECTOR, {
            timeout: threshold,
          });
          await page.waitForSelector(RESPONSE_INDICATOR_SELECTOR, {
            state: 'detached',
            timeout: 3_000,
          });
          return Date.now() - t0;
        }

        await page.waitForTimeout(50);
        return Date.now() - t0;
      },
      threshold,
      20
    );
  });
});
