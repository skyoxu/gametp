/**
 * Enhanced Electron security validation (ASCII-only)
 */

import { test, expect } from '@playwright/test';
import { launchApp } from '../../../helpers/launch';
import type { ElectronApplication, Page } from '@playwright/test';

test.describe('Enhanced Electron security', () => {
  // Isolation basics (ADR-0002)
  test.describe('Isolation Basics', () => {
    let electronApp: ElectronApplication;
    let page: Page;

    test.beforeAll(async () => {
      const { app, page: window } = await launchApp();
      electronApp = app;
      page = window;
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      const url = page.url();
      expect(url.startsWith('chrome-error://')).toBeFalsy();
      console.log(`[Isolation] Page ready: ${url}`);
    });

    test.afterAll(async () => {
      await electronApp.close();
    });

    test('Renderer must not access Node.js APIs', async () => {
      const nodeDisabled = await page.evaluate(() => {
        const w = window as unknown as NodeGlobals;
        return (
          typeof w.require === 'undefined' &&
          typeof w.process === 'undefined' &&
          typeof w.Buffer === 'undefined'
        );
      });
      expect(nodeDisabled).toBe(true);
    });

    test('Context isolation indicators', async () => {
      const isolationEnabled = await page.evaluate(() => {
        const w = window as unknown as NodeGlobals;
        return (
          typeof w.require === 'undefined' &&
          typeof w.global === 'undefined' &&
          typeof w.__dirname === 'undefined'
        );
      });
      expect(isolationEnabled).toBe(true);
    });

    test('Sandbox signals', async () => {
      const sandboxValidation = await page.evaluate(() => {
        const w = window as unknown as NodeGlobals;
        return {
          noNodeAccess: typeof w.process === 'undefined',
          noRequire: typeof w.require === 'undefined',
          noElectronGlobals: typeof w.__dirname === 'undefined',
        };
      });
      expect(sandboxValidation.noNodeAccess).toBe(true);
      expect(sandboxValidation.noRequire).toBe(true);
      expect(sandboxValidation.noElectronGlobals).toBe(true);
    });
  });

  // Preload whitelist API (ADR-0002/0004)
  test.describe('Preload Whitelist API', () => {
    let electronApp: ElectronApplication;
    let page: Page;

    test.beforeAll(async () => {
      const { app, page: window } = await launchApp();
      electronApp = app;
      page = window;
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      const url = page.url();
      expect(url.startsWith('chrome-error://')).toBeFalsy();
    });

    test.afterAll(async () => {
      await electronApp.close();
    });

    test('Only allowed APIs are exposed (or none under strict sandbox)', async () => {
      const apiValidation = await page.evaluate<{
        valid: boolean;
        expected: string[];
        actual: string[];
        missing?: string[];
        unexpected?: string[];
        reason?: string;
      }>(() => {
        type W = Window & { electronAPI?: Record<string, unknown> };
        const electronAPI = (window as unknown as W).electronAPI;
        if (!electronAPI) {
          return {
            valid: true,
            reason: 'sandbox_strict',
            expected: [],
            actual: [],
          };
        }
        const expectedAPIs = [
          'readFile',
          'writeFile',
          'getSystemInfo',
          'minimize',
          'close',
        ];
        const actual = Object.keys(electronAPI);
        const hasAllExpected = expectedAPIs.every(api => actual.includes(api));
        const onlyExpected = actual.every(api => expectedAPIs.includes(api));
        return {
          valid: hasAllExpected && onlyExpected,
          expected: expectedAPIs,
          actual,
          missing: expectedAPIs.filter(api => !actual.includes(api)),
          unexpected: actual.filter(api => !expectedAPIs.includes(api)),
        };
      });
      expect(apiValidation.valid).toBe(true);
      if (apiValidation.unexpected) {
        expect(apiValidation.unexpected).toEqual([]);
      }
    });
  });
});
type NodeGlobals = {
  require?: unknown;
  process?: unknown;
  Buffer?: unknown;
  global?: unknown;
  __dirname?: unknown;
};
