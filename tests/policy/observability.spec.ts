import { describe, it, expect } from 'vitest';
import * as Sentry from '@sentry/electron/main';
import { initSentryMain } from '../../src/shared/observability/sentry-main';

describe('03 Sentry \u521d\u59cb\u5316', () => {
  it('\u5e94\u6210\u529f\u521d\u59cb\u5316\u5e76\u53ef\u88ab\u68c0\u6d4b\u5230', async () => {
    initSentryMain();
    const isInit =
      typeof (Sentry as any).isInitialized === 'function'
        ? (Sentry as any).isInitialized?.()
        : (Sentry as any).getCurrentHub?.().getClient?.() != null;
    expect(isInit).toBe(true);
  });
});
