import { expect, test } from '@playwright/test';
import { launchApp } from '../helpers/launch';
import type { RendererWindow } from '../helpers/renderer-types';

test('IPC 往返基线（开发机）', async () => {
  const { app, page } = await launchApp();
  const samples: number[] = [];

  for (let i = 0; i < 200; i++) {
    const started = Date.now();
    await page.evaluate(() => {
      const win = window as RendererWindow;
      const api = win.electronAPI as { ping?: () => unknown } | undefined;
      return api?.ping?.();
    });
    samples.push(Date.now() - started);
  }

  samples.sort((a, b) => a - b);
  const p95 = samples[Math.floor(samples.length * 0.95)];
  const p99 = samples[Math.floor(samples.length * 0.99)];
  expect(p95).toBeLessThan(10);
  expect(p99).toBeLessThan(20);
  await app.close();
});
