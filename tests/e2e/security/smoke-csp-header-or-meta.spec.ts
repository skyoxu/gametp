// tests/e2e/security/smoke-csp-header-or-meta.spec.ts
import { test, expect } from '@playwright/test';
import { launchAppWithPage } from '../../helpers/launch';

test('CSP present via header or <meta>', async () => {
  // Use unified launcher
  const { app, page } = await launchAppWithPage();

  // 1) readyState guard + ensure not chrome-error (recommended waiting strategy)
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  expect(page.url().startsWith('chrome-error://')).toBeFalsy();

  // 2) dev/test: allow <meta> as one acceptable source
  const hasMeta = await page.$("meta[http-equiv='Content-Security-Policy']");
  const metaOk = !!hasMeta;

  // 3) production: assert inline script is blocked (functional check)
  const inlineAllowed = await page.evaluate(() => {
    try {
      const s = document.createElement('script');
      s.textContent = 'window.__x=1';
      document.head.appendChild(s);
      const x = (globalThis as { __x?: number }).__x;
      return Boolean(x);
    } catch {
      return false;
    }
  });

  expect(metaOk || !inlineAllowed).toBeTruthy();

  await app.close();
});
