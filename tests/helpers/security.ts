// tests/helpers/security.ts
// ASCII-only helper functions for test-time stubs.
import type { Page } from '@playwright/test';

/*
 Injects a test-only stub that forces navigator.mediaDevices.getUserMedia to reject.
 This runs in the renderer context via page.evaluate.
*/
export async function stubDenyGetUserMedia(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      const md = navigator.mediaDevices as unknown as {
        getUserMedia: (constraints?: unknown) => Promise<never>;
      };
      md.getUserMedia = async () => {
        throw new Error('blocked by policy (test stub)');
      };
      return true;
    } catch {
      return false;
    }
  });
}
