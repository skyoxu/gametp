/**
 * Electron smoke tests (ASCII-only)
 * Focus: basic startup, protocol, CSP and preload API diagnostics.
 */

import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp } from '../helpers/launch';
import type {
  RendererWindow,
  RendererNodeGlobalsSnapshot,
  RendererDiagnostics,
  AppStatusInfo,
  RuntimeEnvironmentInfo,
} from '../helpers/renderer-types';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  const launched = await launchApp();
  app = launched.app;
  page = launched.page;
  await page.waitForLoadState('domcontentloaded');

  // Verify URL protocol and not chrome-error
  const url = page.url();
  expect(url.startsWith('app://')).toBeTruthy();
  expect(url.startsWith('chrome-error://')).toBeFalsy();
  console.log(`[INFO] App protocol validated: ${url}`);
});

test.afterAll(async () => {
  await app?.close();
});

test.describe('Electron baseline validation', () => {
  test('App renders main window', async () => {
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).toBeTruthy();
    await expect(page.locator('#root')).toBeVisible();
    console.log(`[INFO] App started with title: "${title}"`);
  });

  test('Security: Node.js globals isolated', async () => {
    const nodeGlobals = await page.evaluate<RendererNodeGlobalsSnapshot>(() => {
      const win = window as RendererWindow;
      return {
        hasRequire: typeof win.require !== 'undefined',
        hasProcess: typeof win.process !== 'undefined',
        hasBuffer: typeof win.Buffer !== 'undefined',
        hasGlobal: typeof win.global !== 'undefined',
        hasSetImmediate: typeof win.setImmediate !== 'undefined',
        hasClearImmediate: typeof win.clearImmediate !== 'undefined',
      };
    });
    expect(
      nodeGlobals.hasRequire,
      'require() must not be exposed to renderer'
    ).toBe(false);
    expect(
      nodeGlobals.hasProcess,
      'process must not be exposed to renderer'
    ).toBe(false);
    expect(
      nodeGlobals.hasBuffer,
      'Buffer must not be exposed to renderer'
    ).toBe(false);
    expect(
      nodeGlobals.hasGlobal,
      'global must not be exposed to renderer'
    ).toBe(false);
    expect(
      nodeGlobals.hasSetImmediate,
      'setImmediate must not be exposed to renderer'
    ).toBe(false);
    expect(
      nodeGlobals.hasClearImmediate,
      'clearImmediate must not be exposed to renderer'
    ).toBe(false);
  });

  test('Security: CSP meta present and strict', async () => {
    const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(cspMeta).toBeAttached();
    const cspContent = await cspMeta.getAttribute('content');
    expect(cspContent).toBeTruthy();
    const content = String(cspContent);
    const hasDefaultSrcSelf = content.includes("default-src 'self'");
    const hasDefaultSrcNone = content.includes("default-src 'none'");
    expect(
      hasDefaultSrcSelf || hasDefaultSrcNone,
      'CSP must define default-src'
    ).toBe(true);
    expect(content).toContain("script-src 'self'");
    expect(content).toContain("style-src 'self'");
    expect(content).not.toContain("'unsafe-inline'");
    expect(content).not.toContain("'unsafe-eval'");
    console.log('[INFO] CSP meta validation passed');
  });

  test('Preload diagnostics (allowlist exposure)', async () => {
    const diag = await page.evaluate<RendererDiagnostics>(() => {
      const win = window as RendererWindow;
      const windowEntries = Object.keys(win);
      const apiKeys = windowEntries.filter(
        key =>
          key.includes('API') ||
          key.includes('Api') ||
          key.includes('api') ||
          key.includes('electron') ||
          key.includes('__CUSTOM')
      );
      const collectKeys = (value: unknown): string[] => {
        if (value && typeof value === 'object') {
          return Object.keys(value as Record<string, unknown>);
        }
        return [];
      };
      return {
        allWindowKeys: windowEntries.slice(0, 20),
        exposedApiKeys: apiKeys,
        electronAPIType: typeof win.electronAPI,
        customAPIType: typeof win.__CUSTOM_API__,
        electronKeys: collectKeys(win.electronAPI),
        customKeys: collectKeys(win.__CUSTOM_API__),
      };
    });
    console.log('[DIAG] Exposed API keys:', diag.exposedApiKeys);
    console.log('[DIAG] electronAPI keys:', diag.electronKeys);
    console.log('[DIAG] customAPI keys:', diag.customKeys);
    // Do not assert presence; sandboxed builds may expose nothing which is acceptable.
  });

  test('No unhandled errors during idle', async () => {
    const consoleErrors: string[] = [];
    const unhandledErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      unhandledErrors.push(err.message);
    });
    await page.waitForTimeout(2000);
    const significantErrors = consoleErrors.filter(
      e =>
        !e.includes('DevTools') &&
        !e.includes('Extension') &&
        !e.includes('chrome-extension')
    );
    if (significantErrors.length)
      console.warn('[WARN] Console errors:', significantErrors);
    if (unhandledErrors.length)
      console.error('[ERROR] Unhandled errors:', unhandledErrors);
    expect(unhandledErrors.length, 'No unhandled errors expected').toBe(0);
  });

  test('App status sanity', async () => {
    const appStatus = await app.evaluate<AppStatusInfo>(
      ({ app, BrowserWindow }) => ({
        isReady: app.isReady(),
        isPackaged: app.isPackaged,
        windowCount: BrowserWindow.getAllWindows().length,
      })
    );
    expect(appStatus.isReady, 'App should be ready').toBe(true);
    expect(
      appStatus.windowCount,
      'At least one window should exist'
    ).toBeGreaterThan(0);
    console.log('[INFO] App status sanity:', appStatus);
  });
});

test.describe('Build/runtime details', () => {
  test('Runtime environment details', async () => {
    const info = await app.evaluate<RuntimeEnvironmentInfo>(({ app }) => ({
      appName: app.getName(),
      appVersion: app.getVersion(),
      isReady: app.isReady(),
      isPackaged: app.isPackaged,
      processVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV || 'unknown',
      checkedAt: new Date().toISOString(),
    }));
    console.log('[INFO] Runtime info:', info);
    expect(info.appName).toBeTruthy();
    expect(info.appVersion).toBeTruthy();
    expect(info.isReady).toBe(true);
    expect(info.processVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(info.nodeVersion).toMatch(/^\d+\.\d+\.\d+/);
  });
});
