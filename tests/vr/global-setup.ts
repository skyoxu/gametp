/**
 *
 *
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log(
    '\ud83c\udfac \u5f00\u59cb\u89c6\u89c9\u56de\u5f52\u6d4b\u8bd5\u5168\u5c40\u8bbe\u7f6e...'
  );

  //
  const outputDirs = [
    'test-results/vr-report',
    'test-results/vr-artifacts',
    'tests/vr/screenshots',
    'tests/vr/baseline',
  ];

  for (const dir of outputDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`\ud83d\udcc1 \u521b\u5efa\u76ee\u5f55: ${dir}`);
    }
  }

  //
  process.env.NODE_ENV = 'test';
  process.env.DISABLE_AUTO_UPDATE = 'true';
  process.env.SKIP_ANALYTICS = 'true';
  process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = 'false';

  //
  if (process.env.UPDATE_SNAPSHOTS === 'true') {
    console.log(
      '\ud83d\udcf8 \u8fd0\u884c\u5728\u57fa\u7ebf\u66f4\u65b0\u6a21\u5f0f\uff0c\u5c06\u751f\u6210\u65b0\u7684\u622a\u56fe\u57fa\u7ebf'
    );
  }

  // CI
  if (process.env.CI) {
    console.log(
      '\ud83d\ude80 CI\u73af\u5883\u68c0\u6d4b\u5230\uff0c\u5e94\u7528CI\u4e13\u7528\u8bbe\u7f6e'
    );

    // CI
    process.env.PLAYWRIGHT_TEST_TIMEOUT = '60000';

    //
    process.env.VR_STRICT_MODE = 'true';
  }

  //
  const requiredFiles = ['src/app.tsx', 'index.html', 'vite.config.ts'];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(
        `\u274c \u5fc5\u8981\u6587\u4ef6\u4e0d\u5b58\u5728: ${file}`
      );
    }
  }

  // artifacts
  if (!process.env.PRESERVE_ARTIFACTS) {
    const artifactsPath = 'test-results/vr-artifacts';
    if (fs.existsSync(artifactsPath)) {
      const files = fs.readdirSync(artifactsPath);
      let cleanedCount = 0;

      files.forEach(file => {
        const filePath = path.join(artifactsPath, file);
        const stats = fs.statSync(filePath);

        // 3
        const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
        if (stats.mtime.getTime() < threeDaysAgo) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(
          `\ud83e\uddf9 \u6e05\u7406\u4e86 ${cleanedCount} \u4e2a\u65e7\u7684\u6d4b\u8bd5\u6587\u4ef6`
        );
      }
    }
  }

  //
  const metadata = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ci: !!process.env.CI,
    updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
    electronPath: process.env.ELECTRON_PATH,
    projects: config.projects.map(p => p.name),
    nodeVersion: process.version,
    platform: process.platform,
  };

  fs.writeFileSync(
    'test-results/vr-metadata.json',
    JSON.stringify(metadata, null, 2)
  );

  console.log(
    '\u2705 \u89c6\u89c9\u56de\u5f52\u6d4b\u8bd5\u5168\u5c40\u8bbe\u7f6e\u5b8c\u6210'
  );
  console.log(
    `   - \u9879\u76ee\u914d\u7f6e: ${config.projects.length} \u4e2a\u6d4f\u89c8\u5668\u914d\u7f6e`
  );
  console.log(
    `   - \u57fa\u7ebf\u6a21\u5f0f: ${process.env.UPDATE_SNAPSHOTS === 'true' ? '\u66f4\u65b0' : '\u5bf9\u6bd4'}`
  );
  console.log(
    `   - \u73af\u5883: ${process.env.CI ? 'CI' : '\u672c\u5730\u5f00\u53d1'}`
  );
}

export default globalSetup;
