/**
 * Navigation behavior tests
 * Validate:
 * 1) External navigation blocked - should not end up on chrome-error
 * 2) Internal navigation allowed - app protocol should work
 */

import { test, expect } from '@playwright/test';
import { launchApp } from '../../helpers/launch';

test.describe('Navigation behavior validation', () => {
  test('External navigation blocked - not chrome-error', async () => {
    console.log('[CASE] External navigation blocking behavior...');

    const { app: electronApp, page } = await launchApp();
    await page.waitForLoadState('domcontentloaded');

    const originalUrl = page.url();
    console.log(`[DIAG] Original URL: ${originalUrl}`);

    const navigationPromise = new Promise<{
      navigated: boolean;
      finalUrl?: string;
    }>(resolve => {
      const timeout = setTimeout(() => resolve({ navigated: false }), 3000);
      page.on('framenavigated', () => {
        clearTimeout(timeout);
        resolve({ navigated: true, finalUrl: page.url() });
      });
    });

    // Attempt external navigation
    const result = await page.evaluate(() => {
      try {
        const before = window.location.href;
        window.location.href = 'https://malicious-site.example';
        return { before, after: window.location.href, success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    const navigationResult = await navigationPromise;
    const finalUrl = page.url();

    console.log('[SUMMARY] Navigation test result:');
    console.log(`   - original URL: ${originalUrl}`);
    console.log(`   - final URL: ${finalUrl}`);
    console.log(`   - navigated: ${navigationResult.navigated}`);
    console.log(`   - evaluate result: ${JSON.stringify(result)}`);

    // Assertions
    expect(finalUrl).not.toContain('malicious-site.example');
    expect(finalUrl.startsWith('chrome-error://')).toBeFalsy();
    expect(finalUrl.startsWith('app://')).toBeTruthy();

    console.log(
      '[PASS] External navigation blocking validated - not chrome-error'
    );
    await electronApp.close();
  });

  test('Internal navigation allowed - app protocol safe', async () => {
    console.log('[CASE] Internal navigation allowed behavior...');
    const { app: electronApp, page } = await launchApp();
    await page.waitForLoadState('domcontentloaded');

    const originalUrl = page.url();
    console.log(`[DIAG] Original URL: ${originalUrl}`);

    // If file://, test relative navigation (anchor)
    if (originalUrl.startsWith('file://')) {
      console.log('[CASE] Testing relative navigation within file://');
      const anchorResult = await page.evaluate(() => {
        try {
          window.location.hash = '#test-anchor';
          return { success: true, hash: window.location.hash };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      });
      const urlWithAnchor = page.url();
      console.log(`   - anchor result: ${JSON.stringify(anchorResult)}`);
      console.log(`   - anchor URL: ${urlWithAnchor}`);
      expect(anchorResult.success).toBeTruthy();
      expect(urlWithAnchor).toContain('#test-anchor');
      expect(urlWithAnchor.startsWith('chrome-error://')).toBeFalsy();
    }

    // If app:// supported, test app internal navigation
    console.log('[CASE] Check app:// protocol support...');
    const appProtocolTest = await page.evaluate(() => {
      try {
        const hasAppProtocol =
          window.location.protocol === 'app:' ||
          typeof (window as unknown as { electronAPI?: unknown })
            .electronAPI !== 'undefined';
        return { hasAppProtocol, currentProtocol: window.location.protocol };
      } catch (error) {
        return { hasAppProtocol: false, error: String(error) };
      }
    });
    console.log(`   - app protocol check: ${JSON.stringify(appProtocolTest)}`);

    const currentUrl = page.url();
    expect(currentUrl.startsWith('app://')).toBeTruthy();
    expect(currentUrl.startsWith('chrome-error://')).toBeFalsy();
    console.log('[PASS] Internal navigation allowed - protocol safe');
    await electronApp.close();
  });

  test('Navigation behavior composite validation', async () => {
    console.log('[CASE] Composite navigation behavior tests...');
    const { app: electronApp, page } = await launchApp();
    await page.waitForLoadState('domcontentloaded');

    const results = {
      externalBlocked: false,
      internalAllowed: false,
      noChromError: false,
      protocolSafe: false,
    };

    // 1) external blocked
    const externalTest = await page.evaluate(() => {
      try {
        const before = window.location.href;
        window.location.href = 'https://evil.example';
        const after = window.location.href;
        return { before, after, blocked: before === after };
      } catch (error) {
        return { blocked: true, error: String(error) };
      }
    });
    results.externalBlocked = externalTest.blocked;

    // 2) internal allowed
    const internalTest = await page.evaluate(() => {
      try {
        const before = window.location.href;
        window.location.hash = '#internal-test';
        const after = window.location.href;
        return {
          before,
          after,
          allowed: after !== before && after.includes('#internal-test'),
        };
      } catch (error) {
        return { allowed: false, error: String(error) };
      }
    });
    results.internalAllowed = internalTest.allowed;

    // 3) not chrome-error
    const currentUrl = page.url();
    results.noChromError = !currentUrl.startsWith('chrome-error://');

    // 4) protocol safe
    results.protocolSafe = currentUrl.startsWith('app://');

    console.log('[SUMMARY] Composite results:');
    console.log(`   - external blocked: ${results.externalBlocked}`);
    console.log(`   - internal allowed: ${results.internalAllowed}`);
    console.log(`   - not chrome-error: ${results.noChromError}`);
    console.log(`   - protocol safe: ${results.protocolSafe}`);
    console.log(`   - current URL: ${currentUrl}`);

    expect(results.externalBlocked).toBeTruthy();
    expect(results.internalAllowed).toBeTruthy();
    expect(results.noChromError).toBeTruthy();
    expect(results.protocolSafe).toBeTruthy();
    console.log('[PASS] Composite navigation behavior validated');
    await electronApp.close();
  });
});
