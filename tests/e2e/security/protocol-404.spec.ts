import { test, expect } from '@playwright/test';
import { launchApp } from '../../helpers/launch';

test.describe('app:// protocol fallback and traversal guard', () => {
  test('non-existent app:// resource falls back (no chrome-error)', async () => {
    const { app, page } = await launchApp();
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      // Navigate to a definitely missing path
      location.href = 'app://__missing__/not-found-12345.html';
    });
    await page.waitForTimeout(500);

    const url = page.url();
    expect(url.startsWith('chrome-error://')).toBeFalsy();
    // Still within our app scheme
    expect(url.startsWith('app://')).toBeTruthy();

    await app.close();
  });

  test('path traversal attempts are neutralized (no chrome-error)', async () => {
    const { app, page } = await launchApp();
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      // Attempt traversal; resolver must guard and serve safe fallback
      location.href = 'app://../../../../etc/passwd';
    });
    await page.waitForTimeout(500);

    const url = page.url();
    expect(url.startsWith('chrome-error://')).toBeFalsy();
    expect(url.startsWith('app://')).toBeTruthy();

    await app.close();
  });
});

