/**
 * DOMhelper - Playwright
 *
 * ElectronDOM
 * "waiting for navigation to finish"
 */

import { expect, type Page } from '@playwright/test';

/**
 * DOMhelper
 *
 * Playwright domcontentloaded +  rAF  networkidle
 * Electron
 *
 * @param page Playwright
 * @param timeout 5000ms
 */
export async function ensureDomReady(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  // 1.  networkidle
  await page.waitForLoadState('domcontentloaded');

  // 2. navigation - Electron
  await page.waitForURL(/.*/, {
    waitUntil: 'domcontentloaded',
    timeout: Math.min(timeout, 15000),
  });

  // 3.
  try {
    await page.waitForLoadState('load', { timeout: Math.min(timeout, 8000) });
  } catch (e) {
    console.warn(
      '[ensureDomReady] load state timeout, continuing with domcontentloaded'
    );
  }

  // 4. body
  await page.waitForFunction(
    () => {
      return document.body && document.readyState === 'complete';
    },
    { timeout: Math.min(timeout, 10000) }
  );

  // 5.  rAF/DOM
  await page.evaluate(
    () =>
      new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );

  // 6. navigation
  await page.waitForTimeout(100);

  // 7. body
  try {
    const isBodyReady = await page.evaluate(() => {
      const body = document.body;
      if (!body) return false;

      // display:none
      const style = window.getComputedStyle(body);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    if (!isBodyReady) {
      throw new Error('Body element is not ready after DOM ready checks');
    }
  } catch (error) {
    console.warn(
      '[ensureDomReady] Body visibility check failed:',
      error.message
    );
    //
    await page.waitForFunction(() => document.body !== null, {
      timeout: Math.min(timeout, 3000),
    });
  }
}

/**
 * /
 *
 *
 * helper"\u5bfc\u822a\u5b8c\u6210"
 *
 * @param clickAction Promise
 */
export async function clickWithoutNavigationWait(
  clickAction: () => Promise<void>
): Promise<void> {
  //  noWaitAfter
  //  SPA/hydration
  await clickAction();
}
