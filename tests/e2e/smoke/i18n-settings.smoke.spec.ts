import { test, expect } from '@playwright/test';
import { launchApp } from '../../helpers/launch';
import { ensureDomReady } from '../../helpers/ensureDomReady';
import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

test('@smoke i18n settings overlay language switch updates UI and aria/title', async () => {
  // Bust build cache to ensure the latest App.tsx is used
  const cacheFile = resolve(process.cwd(), '.e2e-build-cache');
  if (existsSync(cacheFile)) {
    try {
      unlinkSync(cacheFile);
    } catch {
      /* noop */
    }
  }
  const { app: electronApp, page } = await launchApp();
  await ensureDomReady(page);

  // Ensure English baseline
  await page.evaluate(() => localStorage.setItem('app.lang', 'en-US'));
  await page.reload();
  await ensureDomReady(page);

  // Start the game to mount GameCanvas controls
  await page.getByTestId('start-game').click();
  await page.locator('.game-canvas__controls').waitFor();

  // Assert English pause label initially
  await expect(page.locator('.game-canvas__control-btn--pause')).toHaveText(
    /Pause/i
  );

  // Open Settings overlay exposed by App (data-testid=open-settings)
  await page.getByTestId('open-settings').click();
  await page.getByTestId('game-settings-panel').waitFor();

  // Switch to UI tab to reveal language selector
  await page
    .locator('.game-settings-panel__tab')
    .filter({ hasText: 'Interface' })
    .click();

  // Change language to zh-CN via the language select inside Settings panel
  const languageContainer = page
    .locator('.game-settings-panel__select-container')
    .filter({ hasText: 'Language' });
  await languageContainer.locator('select').selectOption('zh-CN');

  // Check aria/title on the close button is updated to Chinese
  const closeBtn = page.locator('.game-settings-panel__close-btn');
  await expect(closeBtn).toHaveAttribute('title', /关闭/);
  await expect(closeBtn).toHaveAttribute('aria-label', /关闭/);

  // Also verify pause button text on GameCanvas is now Chinese
  await expect(page.locator('.game-canvas__control-btn--pause')).toHaveText(
    /暂停/
  );

  await electronApp.close();
});
