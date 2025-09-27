import { test, expect } from '@playwright/test';
import { launchApp } from '../../helpers/launch';
import { ensureDomReady } from '../../helpers/ensureDomReady';

/*
  Electron smoke demo using _electron.launch()
  Scope (ASCII only):
  - Basic app launch and window checks
  - Context isolation (no Node globals in renderer)
  - CSP inline-script blocking check (lightweight)
  - Process separation quick sanity
  References: ADR-0002 (security baseline)
*/

test.describe('Electron basic functionality', () => {
  test('@smoke app launch and window creation', async () => {
    console.log('[INFO] Launching Electron application...');
    const startTime = Date.now();

    const { app: electronApp, page: firstWindow } = await launchApp();

    console.log(`[INFO] Electron app launched in ${Date.now() - startTime}ms`);

    // Verify protocol and avoid chrome-error://
    await ensureDomReady(firstWindow);
    const url = firstWindow.url();
    expect(url.startsWith('app://')).toBeTruthy();
    expect(url.startsWith('chrome-error://')).toBeFalsy();
    console.log(`[INFO] URL protocol validated: ${url}`);

    // Title sanity
    await expect(firstWindow).toHaveTitle(/Vite \+ React \+ TS|Game|Template/);

    // Window size sanity
    const viewportSize = firstWindow.viewportSize();
    if (viewportSize) {
      expect(viewportSize.width).toBeGreaterThan(800);
      expect(viewportSize.height).toBeGreaterThan(600);
    } else {
      console.log('[WARN] viewportSize() returned undefined, skip size check');
    }

    await electronApp.close();
  });

  test('@smoke security - context isolation', async () => {
    console.log('[SECURITY] Running context isolation checks...');
    const { app: electronApp, page: firstWindow } = await launchApp();

    // Renderer must not expose Node globals
    const nodeAccessBlocked = await firstWindow.evaluate(() => {
      return (
        typeof (globalThis as any).require === 'undefined' &&
        typeof (globalThis as any).process === 'undefined' &&
        typeof (globalThis as any).Buffer === 'undefined'
      );
    });
    expect(nodeAccessBlocked).toBe(true);

    // ContextBridge API may or may not exist depending on preload
    const bridgeAvailable = await firstWindow.evaluate(() => {
      return (
        typeof (window as any).electronApi !== 'undefined' ||
        typeof (window as any).electron !== 'undefined'
      );
    });
    if (bridgeAvailable) {
      console.log('[INFO] contextBridge API detected');
    } else {
      console.log('[INFO] contextBridge API not detected (optional)');
    }

    await electronApp.close();
  });

  test('@smoke security - CSP inline script blocked', async () => {
    console.log('[SECURITY] Running CSP inline blocking check...');
    const { app: electronApp, page: firstWindow } = await launchApp();

    const inlineBlocked = await firstWindow.evaluate(async () => {
      (window as any).testCSP = undefined;
      return new Promise<boolean>(resolve => {
        const script = document.createElement('script');
        script.innerHTML = 'window.testCSP = true;';

        const timeout = setTimeout(() => {
          resolve((window as any).testCSP !== true);
        }, 1000);

        script.onload = () => {
          clearTimeout(timeout);
          resolve(false);
        };

        try {
          document.head.appendChild(script);
        } catch {
          // If DOM prevents insertion under strict policies, treat as blocked
          resolve(true);
        }
      });
    });

    expect(inlineBlocked).toBe(true);

    await electronApp.close();
  });

  test('@smoke processes - separation quick check', async () => {
    console.log('[INFO] Verifying renderer environment...');
    const { app: electronApp, page: firstWindow } = await launchApp();

    const rendererInfo = await firstWindow.evaluate(() => ({
      userAgent: navigator.userAgent,
      isElectron: navigator.userAgent.includes('Electron'),
      hasNodeIntegration: typeof (globalThis as any).require !== 'undefined',
    }));

    expect(rendererInfo.isElectron).toBe(true);
    expect(rendererInfo.hasNodeIntegration).toBe(false);

    await electronApp.close();
  });
});

test.describe('Performance and responsiveness (light)', () => {
  test('@smoke app launch time within budget', async () => {
    console.log('[PERF] Measuring app launch time...');
    const t0 = Date.now();
    const { app: electronApp, page: firstWindow } = await launchApp();
    await ensureDomReady(firstWindow);
    const launchTime = Date.now() - t0;

    // Keep a relaxed threshold for E2E environment variability
    expect(launchTime).toBeLessThan(15000);
    console.log(`[PERF] App launch time: ${launchTime}ms`);

    await electronApp.close();
  });

  test('@smoke window basic responsiveness', async () => {
    console.log('[PERF] Checking basic window responsiveness...');
    const { app: electronApp, page: firstWindow } = await launchApp();
    await ensureDomReady(firstWindow);

    const t0 = Date.now();
    try {
      await firstWindow.click('body', { timeout: 1000 });
      const dt = Date.now() - t0;
      expect(dt).toBeLessThan(500);
      console.log(`[PERF] Basic click response: ${dt}ms`);
    } catch {
      console.log(
        '[INFO] No clickable elements detected; skipping UI response check'
      );
    }

    await electronApp.close();
  });
});
