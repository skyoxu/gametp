import { describe, expect, it } from 'vitest';
import * as Sentry from '@sentry/electron/main';
import { initSentryMain } from '../../src/shared/observability/sentry-main';

describe('03 Sentry 初始化', () => {
  it('应成功初始化并可被检测到', async () => {
    initSentryMain();
    const hub = Sentry.getCurrentHub();
    const client = hub.getClient();
    expect(client).toBeTruthy();
  });
});
