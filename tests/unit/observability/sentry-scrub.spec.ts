import { describe, it, expect } from 'vitest';
import {
  filterPIIWithOTelSemantics,
  sanitizeMessage,
  filterSensitiveBreadcrumb,
  type SentryEvent,
  type SentryBreadcrumb,
} from '../../../src/shared/observability/sentry-scrub';

describe('Sentry PII scrubbing (main)', () => {
  it('removes user/email/ip and auth headers', () => {
    const event: SentryEvent = {
      user: { id: 'real-user', email: 'a@b.com', ip_address: '1.2.3.4' },
      request: {
        headers: {
          authorization: 'Bearer SECRET',
          cookie: 'sid=abc',
          'x-api-key': 'XYZ',
        },
      },
    };
    const scrubbed = filterPIIWithOTelSemantics(event, undefined);
    expect(scrubbed.user?.email).toBeUndefined();
    expect(scrubbed.user?.ip_address).toBeUndefined();
    expect(scrubbed.user?.id).toBe('anonymous');
    expect(scrubbed.request?.headers?.authorization).toBeUndefined();
    expect(scrubbed.request?.headers?.cookie).toBeUndefined();
    expect(scrubbed.request?.headers?.['x-api-key']).toBeUndefined();
  });

  it('sanitizes secrets in messages', () => {
    const msg = 'error password=123 token=abc key=zzz secret=hahaha';
    const sanitized = sanitizeMessage(msg);
    expect(sanitized).not.toMatch(/123|abc|zzz|hahaha/);
  });

  it('removes sensitive breadcrumbs', () => {
    const breadcrumb: SentryBreadcrumb = {
      category: 'http',
      level: 'info',
      data: { url: 'https://api.example.com?token=abcd' },
      message: 'fetch',
      timestamp: Date.now() / 1000,
      type: 'default',
    };
    const result = filterSensitiveBreadcrumb(breadcrumb);
    expect(result).toBeNull();
  });
});
