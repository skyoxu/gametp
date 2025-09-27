import { test, expect } from '@playwright/test';
import { testLocationNavigation, testWindowOpen } from '../../helpers/launch';

test('External navigation blocked - not chrome-error', async () => {
  const { app, page } = await import('../../helpers/launch').then(m =>
    m.launchApp()
  );
  await page.waitForLoadState('domcontentloaded');

  // Use helper to attempt external navigation and verify blocked
  const navigationBlocked = await testLocationNavigation(
    page,
    'https://example.com'
  );
  expect(navigationBlocked).toBeTruthy();

  // Not on chrome-error; should remain within our app (app:// or file://)
  const url = page.url();
  expect(url.startsWith('chrome-error://')).toBeFalsy();
  expect(url.startsWith('app://') || url.startsWith('file://')).toBeTruthy();

  await app.close();
});

test('External popup blocked - window.open should be intercepted', async () => {
  const { app, page } = await import('../../helpers/launch').then(m =>
    m.launchApp()
  );
  await page.waitForLoadState('domcontentloaded');

  // Record initial window count
  const initialWindows = await app.windows();
  const initialWindowCount = initialWindows.length;

  // Use helper to attempt opening an external popup
  const popupBlocked = await testWindowOpen(page, 'https://example.com');
  expect(popupBlocked).toBeTruthy();

  // Window count should remain unchanged (popup blocked)
  const currentWindows = await app.windows();
  expect(currentWindows.length).toBe(initialWindowCount);

  await app.close();
});

test('Internal navigation allowed - app protocol should work', async () => {
  const { app, page } = await import('../../helpers/launch').then(m =>
    m.launchApp()
  );
  await page.waitForLoadState('domcontentloaded');

  // Record initial URL (should be app:// or file://)
  const initialUrl = page.url();
  expect(initialUrl.startsWith('chrome-error://')).toBeFalsy();

  // Internal navigation to self should be allowed (no helper)
  await page.evaluate(() => {
    window.location.href = 'index.html';
  });
  await page.waitForTimeout(500);

  // Still within our app and not chrome-error
  const finalUrl = page.url();
  expect(finalUrl.startsWith('chrome-error://')).toBeFalsy();
  expect(finalUrl.startsWith('app://') || finalUrl.startsWith('file://')).toBeTruthy();

  await app.close();
});
