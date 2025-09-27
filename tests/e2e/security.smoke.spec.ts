/*
  Electron Security Smoke Tests (ASCII only)
  - Validate: app visibility, ContextBridge exposure, IPC whitelist, CSP presence, popup/navigation blocking.
  - Full suite runs only when PROJECT_NAME=electron-security-audit; otherwise a placeholder test runs.
  ADR references: ADR-0002 (Electron security baseline), ADR-0005 (Quality gates)
*/

import { test, expect } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { launchAppWithPage } from '../helpers/launch';

// Config
const TEST_TIMEOUT = 30000; // 30s

// Preload-exposed API shape (kept minimal on purpose)
interface WindowWithSecureApi extends Window {
  readonly electronApi?: {
    readonly app?: {
      readonly getVersion?: () => Promise<string>;
      readonly getPlatform?: () => Promise<string>;
      readonly getLocale?: () => Promise<string>;
    };
    readonly security?: {
      readonly reportViolation?: (v: unknown) => Promise<void>;
      readonly getSecurityStatus?: () => Promise<{
        secure: boolean;
        violations: number;
      }>;
    };
  };
}

test.describe('Electron Security Smoke', () => {
  const AUDIT_MODE = process.env.PROJECT_NAME === 'electron-security-audit';

  if (!AUDIT_MODE) {
    test('@smoke placeholder (non-audit mode)', async () => {
      expect(true).toBe(true);
    });
    return;
  }

  let app: ElectronApplication;
  let page: Page;
  let consoleMessages: string[] = [];
  let consoleErrors: string[] = [];

  test.beforeAll(async () => {
    try {
      await app?.close();
    } catch {
      // ignore previous app close errors
    }

    const launched = await launchAppWithPage();
    app = launched.app;
    page = launched.page;

    app.on('console', message => {
      const text = message.text();
      consoleMessages.push(text);
      if (message.type() === 'error') consoleErrors.push(text);
    });

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[PAGE] ${text}`);
      if (msg.type() === 'error') consoleErrors.push(`[PAGE] ${text}`);
    });

    page.on('pageerror', err => {
      consoleErrors.push(`[PAGE ERROR] ${err.message}`);
    });

    await page.waitForLoadState('domcontentloaded', { timeout: TEST_TIMEOUT });
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test.beforeEach(() => {
    consoleMessages = [];
    consoleErrors = [];
  });

  // App boot and visibility
  test('@smoke app window visible', async () => {
    expect(page).toBeTruthy();
    const isVisible = await page.isVisible('body');
    expect(isVisible).toBe(true);

    const title = await page.title();
    expect(title).toBeTruthy();

    const critical = consoleErrors.filter(
      e =>
        e.toLowerCase().includes('failed to load') ||
        e.toLowerCase().includes('uncaught exception')
    );
    expect(critical).toHaveLength(0);
  });

  // ContextBridge exposure
  test('@smoke context bridge exposes safely', async () => {
    const hasApi = await page.evaluate(() => {
      const w = window as WindowWithSecureApi;
      return typeof w.electronApi !== 'undefined';
    });
    expect(hasApi).toBe(true);

    const apiShape = await page.evaluate(() => {
      const w = window as WindowWithSecureApi;
      const api = w.electronApi;
      if (!api) return null;
      return {
        hasApp: typeof api.app === 'object',
        hasSecurity: typeof api.security === 'object',
        hasGetVersion: typeof api.app?.getVersion === 'function',
        hasGetPlatform: typeof api.app?.getPlatform === 'function',
        hasReportViolation: typeof api.security?.reportViolation === 'function',
        hasGetSecurityStatus:
          typeof api.security?.getSecurityStatus === 'function',
      };
    });

    expect(apiShape).toBeTruthy();
    expect(apiShape?.hasApp).toBe(true);
    expect(apiShape?.hasSecurity).toBe(true);
    expect(apiShape?.hasGetVersion).toBe(true);
    expect(apiShape?.hasGetPlatform).toBe(true);
    expect(apiShape?.hasReportViolation).toBe(true);
    expect(apiShape?.hasGetSecurityStatus).toBe(true);
  });

  // IPC whitelist
  test('@smoke IPC whitelist works', async () => {
    const versionCall = await page.evaluate(async () => {
      try {
        const w = window as WindowWithSecureApi;
        const api = w.electronApi;
        if (!api || !api.app?.getVersion) throw new Error('API not available');
        const version = await api.app.getVersion();
        return { ok: true, version };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    });
    expect(versionCall.ok).toBe(true);
    expect(typeof versionCall.version).toBe('string');

    const platformCall = await page.evaluate(async () => {
      try {
        const w = window as WindowWithSecureApi;
        const api = w.electronApi;
        if (!api || !api.app?.getPlatform) throw new Error('API not available');
        const platform = await api.app.getPlatform();
        return { ok: true, platform };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    });
    expect(platformCall.ok).toBe(true);
    // Windows-only template: restrict expected platform
    expect(platformCall.platform).toBe('win32');
  });

  // CSP presence
  test('@smoke CSP meta present and strict', async () => {
    const cspMeta = await page.$('meta[http-equiv="Content-Security-Policy"]');
    expect(cspMeta).toBeTruthy();

    const cspContent = await page.evaluate(() => {
      const meta = document.querySelector(
        'meta[http-equiv="Content-Security-Policy"]'
      );
      return meta?.getAttribute('content') || '';
    });
    expect(cspContent).toBeTruthy();
    expect(cspContent).toContain("default-src 'none'");
    expect(cspContent).not.toContain("'unsafe-inline'");
    expect(cspContent).not.toContain("'unsafe-eval'");
  });

  // Navigation and popup safety
  test('@smoke popups and external navigation blocked', async () => {
    const originalUrl = await page.url();
    const navigationResult = await page.evaluate(() => {
      const originalHref = window.location.href;
      try {
        window.location.href = 'https://malicious-site.example/phishing';
        return {
          navigated: window.location.href !== originalHref,
          currentHref: window.location.href,
          originalHref,
        };
      } catch (error) {
        return {
          navigated: false,
          error: String(error),
          currentHref: window.location.href,
          originalHref,
        };
      }
    });
    expect(navigationResult.navigated).toBe(false);
    expect(await page.url()).toBe(originalUrl);

    const windowOpenResults = await page.evaluate(() => {
      const attempts = [
        { url: 'https://example.com', target: '_blank' },
        { url: 'javascript:alert("xss")', target: '_self' },
        { url: 'about:blank', target: '_blank' },
      ];
      return attempts.map(({ url, target }) => {
        try {
          const w = window.open(url, target);
          return { url, target, blocked: w === null };
        } catch {
          return { url, target, blocked: true };
        }
      });
    });
    windowOpenResults.forEach(r => expect(r.blocked).toBe(true));
    expect(windowOpenResults.length).toBeGreaterThan(0);
  });

  // Overall summary
  test('@smoke overall security summary sound', async () => {
    const summary = await page.evaluate(() => {
      const w = window as WindowWithSecureApi;
      type G = typeof globalThis & {
        require?: unknown;
        process?: unknown;
        global?: unknown;
      };
      return {
        hasSecureApi: typeof w.electronApi !== 'undefined',
        hasCsp: !!document.querySelector(
          'meta[http-equiv="Content-Security-Policy"]'
        ),
        nodeIsolated:
          typeof (globalThis as G).require === 'undefined' &&
          typeof (globalThis as G).process === 'undefined' &&
          typeof (globalThis as G).global === 'undefined',
      };
    });
    expect(summary.hasSecureApi).toBe(true);
    expect(summary.hasCsp).toBe(true);
    expect(summary.nodeIsolated).toBe(true);
  });
});
