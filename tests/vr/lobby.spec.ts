/**
 * /
 *  Playwright Screenshot  UI
 */

import { test, expect } from '@playwright/test';

test.describe('Lobby UI Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    //
    await page.addInitScript(() => {
      //  CSS
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });

    //
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('lobby UI baseline screenshot', async ({ page }) => {
    //
    await page.goto('app://-');

    //
    await page.waitForSelector('[data-testid="lobby-root"]', {
      timeout: 10000,
    });

    //
    await page.waitForFunction(
      () => {
        return window.game && window.game.scene && window.game.scene.isActive();
      },
      { timeout: 15000 }
    );

    //
    await page.waitForTimeout(2000);

    //
    await expect(page).toHaveScreenshot('lobby-baseline.png', {
      animations: 'disabled',
      caret: 'hide',
      // mask: [page.getByTestId('loading-spinner')] //
    });
  });

  test('main menu UI stability', async ({ page }) => {
    await page.goto('app://-');

    //
    await page.waitForSelector('[data-testid="lobby-root"]');
    await page.waitForTimeout(2000);

    //
    const startButton = page.getByTestId('start-game-button');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }

    //
    await expect(page).toHaveScreenshot('main-menu.png', {
      animations: 'disabled',
      caret: 'hide',
      mask: [
        page.getByTestId('time-ticker').catch(() => null), //
        page.getByTestId('player-stats').catch(() => null), //
      ].filter(Boolean),
    });
  });

  test('level selection screen visual consistency', async ({ page }) => {
    await page.goto('app://-');

    //
    await page.waitForSelector('[data-testid="lobby-root"]');
    await page.waitForTimeout(2000);

    // UI
    const levelSelectButton = page.getByTestId('level-select-button');
    if (await levelSelectButton.isVisible()) {
      await levelSelectButton.click();
      await page.waitForTimeout(1500);

      //
      await page.waitForSelector('[data-testid="level-grid"]', {
        timeout: 8000,
      });

      //
      await expect(page).toHaveScreenshot('level-selection.png', {
        animations: 'disabled',
        caret: 'hide',
        mask: [
          page.getByTestId('progress-indicator').catch(() => null),
          page.getByTestId('score-display').catch(() => null),
        ].filter(Boolean),
      });
    }
  });

  test('game settings modal visual regression', async ({ page }) => {
    await page.goto('app://-');
    await page.waitForSelector('[data-testid="lobby-root"]');
    await page.waitForTimeout(2000);

    //
    const settingsButton = page.getByTestId('settings-button');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);

      //
      await page.waitForSelector('[data-testid="settings-modal"]', {
        timeout: 5000,
      });

      //
      await expect(page).toHaveScreenshot('settings-modal.png', {
        animations: 'disabled',
        caret: 'hide',
      });

      //
      await page.getByTestId('settings-close').click();
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('lobby-after-settings-close.png', {
        animations: 'disabled',
        caret: 'hide',
      });
    }
  });

  test('responsive layout visual consistency', async ({ page }) => {
    //
    const viewports = [
      { width: 1920, height: 1080, name: '1080p' },
      { width: 1366, height: 768, name: '768p' },
      { width: 1024, height: 768, name: '1024x768' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('app://-');

      await page.waitForSelector('[data-testid="lobby-root"]');
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot(`lobby-${viewport.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false, //
      });
    }
  });
});
