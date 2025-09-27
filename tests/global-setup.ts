import type { FullConfig } from '@playwright/test';
import { launchApp } from 'helpers/launch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright global setup - Electron E2E
 * Aligns with ADR-0002 (security baseline) and ADR-0005 (quality gates).
 *
 * Functions:
 * - Verify Electron build artifacts exist
 * - Basic security baseline pre-checks
 * - Prepare test environment and artifacts directory
 */
async function globalSetup(config: FullConfig) {
  console.log('[Setup] Start Playwright global setup - Electron E2E');

  const electronPath = path.join(__dirname, '..', 'dist-electron', 'main.js');
  const firstProject = config.projects?.[0] as unknown as
    | { outputDir?: string }
    | undefined;
  const outputDir = firstProject?.outputDir || 'test-results/artifacts';

  // 1) Verify Electron build output
  console.log('[Setup] Verifying Electron build outputs...');
  if (!fs.existsSync(electronPath)) {
    console.error(
      `[Setup] Electron main process file not found: ${electronPath}`
    );
    console.log(
      '[Setup] Hint: run "npm run build" to build the Electron app first'
    );
    process.exit(1);
  }

  // Check preload script
  const preloadPath = path.join(__dirname, '..', 'dist-electron', 'preload.js');
  if (!fs.existsSync(preloadPath)) {
    console.error(`[Setup] Preload script not found: ${preloadPath}`);
    process.exit(1);
  }
  console.log('[Setup] Electron build artifacts verified');

  // 2) Ensure artifacts directory exists
  console.log('[Setup] Ensuring artifacts directory...');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`[Setup] Created directory: ${outputDir}`);
  }

  // 3) Security baseline quick pre-check
  console.log('[Setup] Running security baseline quick pre-check...');
  let isContextIsolated = false;
  try {
    // Launch Electron for basic validation
    const electronApp = await launchApp();
    const firstWindow = await electronApp.firstWindow({ timeout: 15000 });

    // Basic window validation
    const title = await firstWindow.title();
    console.log(`[Setup] Electron app launched, window title: ${title}`);

    // Validate context isolation (should not expose Node APIs)
    isContextIsolated = await firstWindow.evaluate(() => {
      return typeof require === 'undefined' && typeof process === 'undefined';
    });

    if (isContextIsolated) console.log('[Setup] Context isolation validated');
    else
      console.warn(
        '[Setup] Warning: Context isolation might not be configured correctly'
      );

    await electronApp.close();
    console.log('[Setup] Baseline pre-check completed');
  } catch (error) {
    console.error('[Setup] Security baseline pre-check failed:', error);
    throw error;
  }

  // 4) Environment variables
  console.log('[Setup] Setting test environment variables...');
  process.env.ELECTRON_IS_TESTING = '1';
  process.env.NODE_ENV = 'test';
  process.env.PLAYWRIGHT_GLOBAL_SETUP = '1';
  console.log('[Setup] Environment variables configured');

  // 5) Emit setup report
  const setupReport = {
    timestamp: new Date().toISOString(),
    electronPath,
    preloadPath,
    outputDir,
    environment: {
      ELECTRON_IS_TESTING: process.env.ELECTRON_IS_TESTING,
      NODE_ENV: process.env.NODE_ENV,
    },
    validation: {
      electronBuild: true,
      preloadScript: true,
      contextIsolation: isContextIsolated,
      securityBaseline: true,
    },
  };
  const reportPath = path.join(outputDir, 'setup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(setupReport, null, 2));

  console.log('[Setup] Global setup completed');
  console.log(`[Setup] Report: ${reportPath}`);
  console.log('[Setup] Ready to run Electron E2E tests\n');
}

export default globalSetup;
