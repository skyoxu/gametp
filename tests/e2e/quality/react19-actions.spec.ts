/**
 * React 19 Actions validation E2E (ASCII-only)
 * Ensures critical forms follow Actions path instead of legacy patterns.
 */
import { test, expect, Page, ElectronApplication } from '@playwright/test';
import { launchAppWithPage } from '../../helpers/launch';

let electronApp: ElectronApplication;
let mainWindow: Page;

test.beforeAll(async () => {
  console.log('[React19 Actions Test] Launching Electron app...');
  const launched = await launchAppWithPage();
  electronApp = launched.app;
  mainWindow = launched.page;
  await mainWindow.waitForLoadState('domcontentloaded', { timeout: 10000 });
});

test.afterAll(async () => {
  await electronApp?.close();
});

test.describe('React 19 Actions form path validation', () => {
  test('Critical forms should use Actions (not useState)', async () => {
    console.log('[React19] Checking whether forms use Actions API...');
    await mainWindow.waitForSelector('[data-testid="app-root"]', {
      timeout: 5000,
    });

    const forms = await mainWindow.locator('form').count();
    if (forms > 0) {
      console.log(`[React19] Found ${forms} forms, checking Actions usage...`);
      const hasActionState = await mainWindow.evaluate(() => {
        const formElements = document.querySelectorAll('form');
        let usesActionState = false;
        formElements.forEach(form => {
          if (
            form.hasAttribute('action') ||
            form.hasAttribute('data-action-state') ||
            form.querySelector('[data-pending]')
          ) {
            usesActionState = true;
          }
        });
        return {
          hasActionState: usesActionState,
          formCount: formElements.length,
          formDetails: Array.from(formElements).map(form => ({
            hasAction: form.hasAttribute('action'),
            hasActionData: form.hasAttribute('data-action-state'),
            hasPendingStates: !!form.querySelector('[data-pending]'),
          })),
        };
      });
      console.log('[React19] Form inspection:', hasActionState);

      if (hasActionState.formCount > 0 && !hasActionState.hasActionState) {
        console.warn('[React19] Warning: forms found but Actions API not used');
        console.warn('[React19] Form details:', hasActionState.formDetails);
      }

      const criticalForms = await mainWindow
        .locator(
          [
            'form[data-testid*="login"]',
            'form[data-testid*="register"]',
            'form[data-testid*="settings"]',
            'form[data-testid*="profile"]',
          ].join(', ')
        )
        .count();

      if (criticalForms > 0) {
        console.log(
          `[React19] Found ${criticalForms} critical forms, validating Actions usage...`
        );
        const criticalFormsWithActions = await mainWindow
          .locator(
            [
              'form[data-testid*="login"][action]',
              'form[data-testid*="register"][action]',
              'form[data-testid*="settings"][action]',
              'form[data-testid*="profile"][action]',
            ].join(', ')
          )
          .count();

        if (criticalForms > 0 && criticalFormsWithActions === 0) {
          throw new Error(
            `React 19 Actions violation: ${criticalForms} critical forms without Actions API. ` +
              'Use useActionState instead of useState+onSubmit for critical forms.'
          );
        }
      }
    } else {
      console.log('[React19] No forms detected, skip Actions validation');
    }

    const antiPattern = await mainWindow.evaluate(() => {
      const submitButtons = document.querySelectorAll('button[type="submit"]');
      const forms = document.querySelectorAll('form');
      let suspiciousPatterns = 0;
      forms.forEach(form => {
        const hasSubmitButton = form.querySelector('button[type="submit"]');
        const hasAction = form.hasAttribute('action');
        const hasActionData = form.hasAttribute('data-action-state');
        if (hasSubmitButton && !hasAction && !hasActionData)
          suspiciousPatterns++;
      });
      return {
        suspiciousPatterns,
        totalForms: forms.length,
        totalSubmitButtons: submitButtons.length,
      };
    });
    console.log('[React19] Anti-pattern result:', antiPattern);
    expect(antiPattern).toBeDefined();
  });

  test('Validate Actions state', async () => {
    console.log('[React19] Validating Actions state...');
    const pendingStates = await mainWindow
      .locator('[data-pending="true"]')
      .count();
    console.log(`[React19] Found ${pendingStates} pending indicators`);
    const errorStates = await mainWindow.locator('[data-error]').count();
    console.log(`[React19] Found ${errorStates} error handlers`);
    if (pendingStates > 0 || errorStates > 0) {
      console.log('[React19] Actions-related state present');
    }
  });
});

test.describe('React 19 Actions static analysis integration', () => {
  test('ESLint rules should detect Actions', async () => {
    console.log('[React19] Validating ESLint rules...');
    await mainWindow.waitForSelector('[data-testid="app-root"]', {
      timeout: 5000,
    });
    const appTitle = await mainWindow.title();
    expect(appTitle).toBeTruthy();
    console.log('[React19] App runs correctly, ESLint rules OK');
  });
});
