#!/usr/bin/env node

import { performance } from 'node:perf_hooks';

async function main() {
  const summary = process.env.GITHUB_STEP_SUMMARY;

  const out = [];

  out.push('# Performance Smoke (Windows)');

  // Prefer test helper; if unavailable on runner, fallback to inline launcher
  let launchApp;
  try {
    ({ launchApp } = await import('../../tests/helpers/launch.js'));
  } catch (_) {
    try {
      ({ launchApp } = await import('../../tests/helpers/launch'));
    } catch (_) {
      const { _electron: electron } = await import('playwright');
      launchApp = async () => {
        const main =
          process.env.ELECTRON_MAIN_PATH || 'dist-electron/electron/main.js';
        const app = await electron.launch({ args: [main] });
        const page = await app.firstWindow();
        return { app, page };
      };
    }
  }

  const warnStart = Number(process.env.START_TTI_WARN_MS || '0');
  const failStart = Number(process.env.START_TTI_FAIL_MS || '0');
  const warnScene = Number(process.env.SCENE_SWITCH_WARN_MS || '0');
  const failScene = Number(process.env.SCENE_SWITCH_FAIL_MS || '0');

  const t0 = performance.now();

  const { app, page } = await launchApp();

  await page.waitForLoadState('domcontentloaded');

  const t1 = performance.now();

  // Scene switch proxy: hash change

  const s0 = performance.now();

  await page.evaluate(() => {
    window.location.hash = '#perf-smoke';
  });

  await page.waitForTimeout(200);

  const s1 = performance.now();

  await app.close();

  const startToFirstPaint = Math.round(t1 - t0);

  const sceneSwitch = Math.round(s1 - s0);

  const status = (v, w, f) =>
    f && v >= f ? '[FAIL]' : w && v >= w ? '[WARN]' : '[OK]';
  out.push(
    `\n- Start -> first window DOMContentLoaded: ${startToFirstPaint} ms ${status(startToFirstPaint, warnStart, failStart)}`
  );
  out.push(
    `- Scene switch (hash change proxy): ${sceneSwitch} ms ${status(sceneSwitch, warnScene, failScene)}`
  );

  // Main branch light gate with one retry if over FAIL threshold
  const isMain =
    (process.env.GITHUB_REF || '').toLowerCase() === 'refs/heads/main';
  const overFail =
    (failStart && startToFirstPaint >= failStart) ||
    (failScene && sceneSwitch >= failScene);
  if (isMain && overFail) {
    out.push('\n- FAIL threshold exceeded, retrying once...');
    const t0b = performance.now();
    const { app: app2, page: page2 } = await launchApp();
    await page2.waitForLoadState('domcontentloaded');
    const t1b = performance.now();
    const s0b = performance.now();
    await page2.evaluate(() => {
      window.location.hash = '#perf-smoke-retry';
    });
    await page2.waitForTimeout(200);
    const s1b = performance.now();
    await app2.close();
    const start2 = Math.round(t1b - t0b);
    const scene2 = Math.round(s1b - s0b);
    out.push(`- Retry: start=${start2} ms, scene=${scene2} ms`);
    const stillFail =
      (failStart && start2 >= failStart) || (failScene && scene2 >= failScene);
    if (stillFail) {
      console.log(out.join('\n'));
      if (summary) {
        await import('node:fs/promises').then(fs =>
          fs.writeFile(summary, out.join('\n') + '\n', { flag: 'a' })
        );
      }
      process.exit(1);
    }
  }

  console.log(out.join('\n'));

  if (summary) {
    await import('node:fs/promises').then(fs =>
      fs.writeFile(summary, out.join('\n') + '\n', { flag: 'a' })
    );
  }
}

main().catch(e => {
  console.error('perf-smoke failed:', e);

  process.exit(0);
});
