/**
 * UI
 *
 */

import { test, expect } from '@playwright/test';

test.describe('Game UI Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    //
    await page.addInitScript(() => {
      //
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        /* \u9690\u85cf\u53ef\u80fd\u7684\u5149\u6807\u95ea\u70c1 */
        input, textarea { caret-color: transparent !important; }
      `;
      document.head.appendChild(style);
    });

    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('game HUD overlay visual stability', async ({ page }) => {
    await page.goto('app://-');
    await page.waitForSelector('[data-testid="lobby-root"]');

    //
    const quickStartButton = page.getByTestId('quick-start-button');
    if (await quickStartButton.isVisible()) {
      await quickStartButton.click();

      // HUD
      await page.waitForSelector('[data-testid="game-hud"]', {
        timeout: 10000,
      });
      await page.waitForTimeout(2000);

      // HUD
      await expect(page).toHaveScreenshot('game-hud-overlay.png', {
        animations: 'disabled',
        caret: 'hide',
        mask: [
          page.getByTestId('game-timer').catch(() => null),
          page.getByTestId('fps-counter').catch(() => null),
          page.getByTestId('score-counter').catch(() => null),
        ].filter(Boolean),
      });
    }
  });

  test('pause menu visual consistency', async ({ page }) => {
    await page.goto('app://-');
    await page.waitForSelector('[data-testid="lobby-root"]');
    await page.waitForTimeout(2000);

    //
    const quickStartButton = page.getByTestId('quick-start-button');
    if (await quickStartButton.isVisible()) {
      await quickStartButton.click();
      await page.waitForTimeout(3000);

      // ESC
      await page.keyboard.press('Escape');

      //
      await page.waitForSelector('[data-testid="pause-menu"]', {
        timeout: 5000,
      });

      await expect(page).toHaveScreenshot('pause-menu.png', {
        animations: 'disabled',
        caret: 'hide',
      });
    }
  });

  test('inventory and toolbar visual regression', async ({ page }) => {
    await page.goto('app://-');
    await page.waitForSelector('[data-testid="lobby-root"]');
    await page.waitForTimeout(2000);

    const quickStartButton = page.getByTestId('quick-start-button');
    if (await quickStartButton.isVisible()) {
      await quickStartButton.click();
      await page.waitForTimeout(3000);

      // /
      await page.keyboard.press('I'); // I

      await page.waitForSelector('[data-testid="inventory-panel"]', {
        timeout: 5000,
      });

      await expect(page).toHaveScreenshot('inventory-panel.png', {
        animations: 'disabled',
        caret: 'hide',
        mask: [
          page.getByTestId('item-tooltip').catch(() => null), //
        ].filter(Boolean),
      });
    }
  });

  test('dialog and notification visual stability', async ({ page }) => {
    await page.goto('app://-');
    await page.waitForSelector('[data-testid="lobby-root"]');
    await page.waitForTimeout(2000);

    //
    const helpButton = page.getByTestId('help-button');
    if (await helpButton.isVisible()) {
      await helpButton.click();

      await page.waitForSelector('[data-testid="help-dialog"]', {
        timeout: 5000,
      });

      await expect(page).toHaveScreenshot('help-dialog.png', {
        animations: 'disabled',
        caret: 'hide',
      });

      //
      await page.getByTestId('dialog-close').click();
      await page.waitForTimeout(500);
    }

    //
    const notificationArea = page.getByTestId('notifications');
    if (await notificationArea.isVisible()) {
      await expect(page).toHaveScreenshot('notifications-area.png', {
        animations: 'disabled',
        caret: 'hide',
        clip: await notificationArea.boundingBox(), //
      });
    }
  });

  test('loading states visual consistency', async ({ page }) => {
    await page.goto('app://-');

    //
    const loadingIndicator = page.getByTestId('loading-indicator');
    if (await loadingIndicator.isVisible()) {
      await expect(page).toHaveScreenshot('loading-state.png', {
        animations: 'disabled',
        caret: 'hide',
        mask: [
          page.getByTestId('loading-spinner').catch(() => null), //
        ].filter(Boolean),
      });
    }
  });

  test('error states visual regression', async ({ page }) => {
    //
    await page.route('**/api/**', route => route.abort()); // API

    await page.goto('app://-');
    await page.waitForTimeout(3000);

    //
    const errorMessage = page.getByTestId('error-message');
    if (await errorMessage.isVisible()) {
      await expect(page).toHaveScreenshot('error-state.png', {
        animations: 'disabled',
        caret: 'hide',
      });
    }
  });
});
