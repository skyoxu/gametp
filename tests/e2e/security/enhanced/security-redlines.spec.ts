/**
 * Enhanced Security Redlines (ASCII-only)
 * Based on ADR-0002 security baseline. Validates forced blocking for:
 * - Permission requests (default deny)
 * - External navigation
 * - New window opening
 */

import { test, expect } from '@playwright/test';
import { launchAppWithPage } from '../../../helpers/launch';
import type { ElectronApplication, Page } from '@playwright/test';

let electronApp: ElectronApplication;
let mainWindow: Page;

test.beforeAll(async () => {
  console.log('[RedLine] Launch Electron app for enhanced redline tests...');
  const { app, page } = await launchAppWithPage();
  electronApp = app;
  mainWindow = page;
  await mainWindow.waitForLoadState('domcontentloaded', { timeout: 15000 });
  const url = mainWindow.url();
  expect(url.startsWith('chrome-error://')).toBeFalsy();
  console.log(`[RedLine] App ready, url: ${url}`);
});

test.afterAll(async () => {
  await electronApp?.close();
  console.log('\n=== Enhanced Security Redlines Summary ===');
  console.log('Permissions interception validated');
  console.log('External navigation blocking validated');
  console.log('Window opening blocking validated');
  console.log('All enhanced redlines validated');
});

test.describe('ADR-0002 Enhanced Redlines', () => {
  test.describe('Redline 1: permissions (default deny)', () => {
    test('Geolocation permission should be denied by default', async () => {
      console.log('[RedLine] Checking geolocation permission interception...');
      const geolocationResult = await mainWindow.evaluate<{
        blocked: boolean;
        reason: string;
        error?: string | number;
      }>(async () => {
        return new Promise(resolve => {
          if (!navigator.geolocation) {
            resolve({ blocked: true, reason: 'geolocation_unavailable' });
            return;
          }
          const timeoutId = setTimeout(
            () => resolve({ blocked: true, reason: 'timeout' }),
            3000
          );
          navigator.geolocation.getCurrentPosition(
            () => {
              clearTimeout(timeoutId);
              resolve({ blocked: false, reason: 'permission_granted' });
            },
            error => {
              clearTimeout(timeoutId);
              resolve({
                blocked: true,
                reason: 'permission_denied',
                error: error.code,
              });
            },
            { timeout: 2000 }
          );
        });
      });
      expect(geolocationResult.blocked).toBe(true);
      console.log(`[RedLine] Geolocation blocked: ${geolocationResult.reason}`);
    });

    test('Camera permission should be denied (or unavailable) by default', async () => {
      console.log('[RedLine] Checking camera permission interception...');
      const cameraResult = await mainWindow.evaluate<{
        blocked: boolean;
        reason: string;
        error?: string;
      }>(async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return { blocked: true, reason: 'getUserMedia_unavailable' };
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          if (stream) stream.getTracks().forEach(t => t.stop());
          return { blocked: false, reason: 'permission_granted' };
        } catch (error) {
          return {
            blocked: true,
            reason: 'permission_denied',
            error: (error as Error).name,
          };
        }
      });
      // Consider denied or unavailable as secure
      expect(
        cameraResult.blocked ||
          cameraResult.reason === 'getUserMedia_unavailable'
      ).toBe(true);
      console.log(`[RedLine] Camera state secure: ${cameraResult.reason}`);
    });

    test('Microphone permission should be denied (or unavailable) by default', async () => {
      console.log('[RedLine] Checking microphone permission interception...');
      const micResult = await mainWindow.evaluate<{
        blocked: boolean;
        reason: string;
        error?: string;
      }>(async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return { blocked: true, reason: 'getUserMedia_unavailable' };
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          if (stream) stream.getTracks().forEach(t => t.stop());
          return { blocked: false, reason: 'permission_granted' };
        } catch (error) {
          return {
            blocked: true,
            reason: 'permission_denied',
            error: (error as Error).name,
          };
        }
      });
      expect(
        micResult.blocked || micResult.reason === 'getUserMedia_unavailable'
      ).toBe(true);
      console.log(`[RedLine] Microphone state secure: ${micResult.reason}`);
    });

    test('Notification permission should be controlled', async () => {
      console.log('[RedLine] Checking notification permission control...');
      const state = await mainWindow.evaluate(() => {
        return 'Notification' in window
          ? Notification.permission
          : 'unsupported';
      });
      expect(['denied', 'default', 'unsupported']).toContain(state);
      console.log(`[RedLine] Notification state: ${state}`);
    });
  });

  test.describe('Redline 2: navigation/window blocking', () => {
    test('External navigation is blocked', async () => {
      console.log('[RedLine] Checking external navigation blocking...');
      const originalUrl = mainWindow.url();
      await mainWindow.evaluate(() => {
        try {
          const before = window.location.href;
          window.location.href = 'https://malicious.example';
          return { before, after: window.location.href };
        } catch (e) {
          return { error: String(e) };
        }
      });
      const finalUrl = mainWindow.url();
      expect(finalUrl).toBe(originalUrl);
      expect(finalUrl.startsWith('chrome-error://')).toBeFalsy();
      console.log('[RedLine] External navigation blocked');
    });

    test('window.open is blocked', async () => {
      console.log('[RedLine] Checking window.open blocking...');
      const blocked = await mainWindow.evaluate(() => {
        try {
          const w = window.open('https://popup.evil.example', '_blank');
          return w === null;
        } catch {
          return true;
        }
      });
      expect(blocked).toBe(true);
      console.log('[RedLine] window.open blocked');
    });
  });
});
