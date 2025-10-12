import { test, expect } from '@playwright/test';
import { launchApp } from '../../helpers/launch';
import { ensureDomReady } from '../../helpers/ensureDomReady';

test('@smoke i18n language toggle reflects in GameCanvas controls', async () => {
  const { app: electronApp, page } = await launchApp();
  await ensureDomReady(page);

  // Force English first
  await page.evaluate(() => localStorage.setItem('app.lang', 'en-US'));
  await page.reload();
  await ensureDomReady(page);

  // Start game to mount GameCanvas
  await page.getByTestId('start-game').click();
  await page.locator('.game-canvas__controls').waitFor();

  // Expect English text on Pause button
  await expect(page.locator('.game-canvas__control-btn--pause')).toHaveText(
    /Pause/i
  );

  // Switch to Chinese and reload
  await page.evaluate(() => localStorage.setItem('app.lang', 'zh-CN'));
  await page.reload();
  await ensureDomReady(page);

  // Need to start game again after reload
  await page.getByTestId('start-game').click();
  await page.locator('.game-canvas__controls').waitFor();

  // Expect Chinese text on Pause button
  await expect(page.locator('.game-canvas__control-btn--pause')).toHaveText(
    /暂停/
  );

  await electronApp.close();
});
