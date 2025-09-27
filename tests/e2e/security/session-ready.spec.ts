import { test, expect } from '@playwright/test';
import { launchApp } from '../../helpers/launch';

test(
  'ADR-0002: use defaultSession only after app ready; first window opens',
  { timeout: 180000 },
  async () => {
    const { app, page: win } = await launchApp();

    // After electron.launch()/firstWindow(), use document.readyState to gate readiness.
    // Ensure first window is available and Electron fully initialized.
    await win.waitForLoadState('domcontentloaded');

    // Now safe to access session.defaultSession
    const ok = await app.evaluate(async ({ app, session }) => {
      if (!app.isReady()) return false;
      try {
        return !!session.defaultSession;
      } catch {
        return false;
      }
    });
    expect(ok).toBe(true);

    // Sanity: window exists
    await expect(win).toBeTruthy();

    // Optional: validate CSP via <meta http-equiv="Content-Security-Policy"> or response headers
    await app.close();
  }
);
