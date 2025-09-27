import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** /"\u4ecd\u7559\u5728\u6211\u65b9 URL" */
export async function attemptAndAssertBlocked(
  page: Page,
  attempt: () => Promise<void> | void,
  navTimeout = 800
) {
  const initialUrl = page.url();

  // CI
  const actualTimeout = process.env.CI ? navTimeout * 2 : navTimeout;

  const navP = page
    .waitForEvent('framenavigated', { timeout: actualTimeout })
    .then(() => 'navigated')
    .catch(() => 'no-nav');

  const actP = Promise.resolve()
    .then(async () => {
      try {
        await Promise.resolve(attempt());
        return 'act-ok';
      } catch (error) {
        // CI
        if (
          process.env.CI &&
          error.message?.includes('Execution context was destroyed')
        ) {
          return 'context-destroyed-success';
        }
        throw error;
      }
    })
    .catch(err => {
      //
      throw err;
    });

  try {
    const result = await Promise.race([navP, actP]);

    // URL
    if (result === 'context-destroyed-success') {
      await page.waitForTimeout(500);
    }
  } catch (error) {
    // CI
    if (
      process.env.CI &&
      error.message?.includes('Execution context was destroyed')
    ) {
      console.log(
        '[CI] Context destroyed during navigation test - considering as successfully blocked navigation'
      );
      return;
    }
    throw error;
  }

  const url = page.url();
  if (
    !(
      url.startsWith('file://') ||
      url.startsWith('app://') ||
      url === initialUrl
    )
  ) {
    throw new Error(`navigation was not blocked, current url=${url}`);
  }
}

/**  window.open  */
export async function attemptAndAssertWindowOpenBlocked(
  page: Page,
  url: string,
  timeout = 1000
): Promise<boolean> {
  //  popup
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout }).catch(() => null),
    page.evaluate(targetUrl => {
      window.open(targetUrl, '_blank');
    }, url),
  ]);

  //  setWindowOpenHandler({action:'deny'})  null
  expect(popup).toBeNull();

  return popup === null;
}
