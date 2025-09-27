import { test, expect } from '@playwright/test';
import { launchApp } from '../../helpers/launch';

test.describe('Error page leakage guards (Windows)', () => {
  test('no absolute path leakage on missing resource', async () => {
    const { app, page } = await launchApp();
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      // Force a missing path; protocol handler should fallback safely
      location.href = 'app://missing/does-not-exist-123.html';
    });
    // Wait for navigation to settle deterministically
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => document.readyState === 'complete', {
      timeout: 5000,
    });

    const html = await page.content();
    // Windows absolute path patterns
    expect(html).not.toMatch(/[A-Z]:\\\\/);
    // Ensure not on chrome-error
    expect(page.url().startsWith('chrome-error://')).toBeFalsy();

    await app.close();
  });

  test('production-like page should not show detailed stack', async () => {
    const { app, page } = await launchApp();
    await page.waitForLoadState('domcontentloaded');

    // Trigger a renderer error and check that the DOM does not dump a stack
    await page.evaluate(() => {
      try { (window as any).__force_error__(); } catch {}
    });
    await page.waitForTimeout(300);

    const html = await page.content();
    // Common stack trace patterns
    expect(html).not.toMatch(/\nat\s+[^(]+\(/);
    expect(html).not.toMatch(/Error:\s/);

    await app.close();
  });
});
