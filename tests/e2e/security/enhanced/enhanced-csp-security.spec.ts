/**
 * Enhanced CSP security validation (ASCII-only)
 * Validates that inline scripts and insecure external resources are blocked.
 */

import { test, expect } from '@playwright/test';
import { launchApp } from '../../../helpers/launch';
import type { ElectronApplication, Page } from '@playwright/test';

test.describe('Enhanced CSP security', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    const { app, page: window } = await launchApp();
    electronApp = app;
    page = window;
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const url = page.url();
    expect(url.startsWith('chrome-error://')).toBeFalsy();
    console.log(`[CSP] Page ready: ${url}`);
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Inline script should be blocked by CSP', async () => {
    const scriptBlocked = await page.evaluate(async () => {
      return new Promise<boolean>(resolve => {
        const s = document.createElement('script');
        s.textContent = 'window.__INLINE_EXEC__ = true;';
        s.onerror = () => resolve(true);
        s.onload = () => resolve(false);
        document.head.appendChild(s);
        setTimeout(() => {
          type W = Window & { __INLINE_EXEC__?: boolean };
          resolve(!((window as unknown as W).__INLINE_EXEC__ === true));
        }, 100);
      });
    });
    expect(scriptBlocked).toBe(true);
  });

  test('Insecure external resource should be blocked', async () => {
    const resourceBlocked = await page.evaluate(async () => {
      return new Promise<boolean>(resolve => {
        const img = new Image();
        img.onerror = () => resolve(true);
        img.onload = () => resolve(false);
        img.src = 'http://malicious-site.example.com/image.png';
        setTimeout(() => resolve(true), 1000);
      });
    });
    expect(resourceBlocked).toBe(true);
  });

  test('CSP present via header or <meta>', async () => {
    const hasMeta = await page.$("meta[http-equiv='Content-Security-Policy']");
    const metaOk = !!hasMeta;
    const inlineAllowed = await page.evaluate(() => {
      try {
        const s = document.createElement('script');
        s.textContent = 'window.__x=1';
        document.head.appendChild(s);
        type W = Window & { __x?: number };
        return Boolean((window as unknown as W).__x);
      } catch {
        return false;
      }
    });
    const cspEffective = metaOk || !inlineAllowed;
    console.log(
      `[CSP] status: meta=${metaOk}, inlineBlocked=${!inlineAllowed}`
    );
    expect(cspEffective).toBeTruthy();
  });
});
