import { test, expect } from '@playwright/test';
import { launchApp } from '../helpers/launch';

test('Security guard active (CSP & Node disabled)', async () => {
  // Use unified launcher
  const { app, page: win } = await launchApp();

  // Renderer must not expose Node capabilities
  const hasRequire = await win.evaluate(() => {
    type W = Window & { require?: unknown };
    return typeof (window as unknown as W).require !== 'undefined';
  });
  expect(hasRequire).toBe(false);

  // CSP meta should exist
  const csp = await win.evaluate(() =>
    document
      .querySelector('meta[http-equiv="Content-Security-Policy"]')
      ?.getAttribute('content')
  );
  expect(csp).toBeTruthy();

  await app.close();
});
