import { test } from '@playwright/test';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('clear transform cache once before all projects', async () => {
  console.log('[Cache Setup] Starting Playwright Transform cache cleanup...');

  //  Official command: Clear all Playwright caches (including transform cache)
  try {
    execSync('npx playwright clear-cache', { stdio: 'inherit' });
    console.log('[Cache Setup] \u2705 Official cache cleanup completed');
  } catch {
    console.warn(
      '[Cache Setup] \u26a0\ufe0f Official cache cleanup failed, proceeding with manual cleanup'
    );
  }

  //  Windows fallback: Direct deletion of transform cache directory (as recommended in issues)
  const dir = join(tmpdir(), 'playwright-transform-cache');
  try {
    rmSync(dir, { recursive: true, force: true });
    console.log(`[Cache Setup] \u2705 Manual cache directory deletion: ${dir}`);
  } catch {
    console.log(
      `[Cache Setup] \u2139\ufe0f Cache directory does not exist or already cleared: ${dir}`
    );
  }

  console.log(
    '[Cache Setup] \ud83c\udfaf Transform cache cleanup complete, all projects will use latest source code'
  );
});
