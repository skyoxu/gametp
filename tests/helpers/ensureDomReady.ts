import type { Page } from '@playwright/test';

const DEFAULT_TIMEOUT = 5_000;
const MAX_TIMEOUT = 15_000;

export async function ensureDomReady(
  page: Page,
  timeout: number = DEFAULT_TIMEOUT
): Promise<void> {
  const adjustedTimeout = Math.min(timeout, MAX_TIMEOUT);

  await page.waitForLoadState('domcontentloaded', { timeout: adjustedTimeout });
  await page.waitForURL(/.*/, {
    waitUntil: 'domcontentloaded',
    timeout: adjustedTimeout,
  });

  try {
    await page.waitForLoadState('load', {
      timeout: Math.min(timeout, 8_000),
    });
  } catch (error) {
    console.warn(
      '[ensureDomReady] load state timeout, continuing with domcontentloaded',
      error
    );
  }

  await page.waitForFunction(
    () => document.body !== null && document.readyState === 'complete',
    { timeout: Math.min(timeout, 10_000) }
  );

  await page.evaluate(
    () =>
      new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );

  await page.waitForTimeout(100);

  const bodyReady = await page.evaluate(() => {
    const body = document.body;
    if (!body) return false;
    const style = window.getComputedStyle(body);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });

  if (!bodyReady) {
    console.warn('[ensureDomReady] Body element not ready, retrying...');
    await page.waitForFunction(() => document.body !== null, {
      timeout: Math.min(timeout, 3_000),
    });
  }
}

export async function clickWithoutNavigationWait(
  clickAction: () => Promise<void>
): Promise<void> {
  await clickAction();
}
