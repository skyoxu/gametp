import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
  require('tsconfig-paths/register');
} catch {}

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180000,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['line'],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
