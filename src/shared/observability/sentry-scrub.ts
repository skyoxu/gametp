// Lightweight Sentry scrubbing helpers for unit tests and reuse.
// No Electron imports; keep types strict to avoid lint suppressions.

export interface SentryHeaders extends Record<string, string | undefined> {}

export interface SentryUser {
  id?: string;
  email?: string;
  ip_address?: string;
}

export interface SentryExceptionValue {
  message?: string;
}

export interface SentryEvent {
  user?: SentryUser;
  request?: {
    headers?: SentryHeaders;
  };
  exception?: {
    values?: SentryExceptionValue[];
  };
}

export interface SentryBreadcrumb {
  category?: string;
  level?: string;
  data?: Record<string, unknown>;
  message?: string;
  timestamp?: number;
  type?: string;
}

export function sanitizeMessage(message: string): string {
  return (message || '')
    .replace(/password[=:]\s*[^\s]+/gi, 'password=[REDACTED]')
    .replace(/token[=:]\s*[^\s]+/gi, 'token=[REDACTED]')
    .replace(/key[=:]\s*[^\s]+/gi, 'key=[REDACTED]')
    .replace(/secret[=:]\s*[^\s]+/gi, 'secret=[REDACTED]')
    .replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[CARD_NUMBER]');
}

export function filterPIIWithOTelSemantics(
  event: SentryEvent,
  _hint?: unknown
): SentryEvent {
  const scrubbed: SentryEvent = {
    ...event,
    request: event.request ? { ...event.request } : event.request,
    user: event.user ? { ...event.user } : event.user,
    exception: event.exception
      ? {
          ...event.exception,
          values: event.exception.values
            ? [...event.exception.values]
            : event.exception.values,
        }
      : event.exception,
  };

  if (scrubbed.request?.headers) {
    const headers: SentryHeaders = { ...scrubbed.request.headers };
    delete headers.authorization;
    delete headers.cookie;
    delete headers['x-api-key'];
    scrubbed.request.headers = headers;
  }

  if (scrubbed.user) {
    const user: SentryUser = { ...scrubbed.user };
    delete user.email;
    delete user.ip_address;
    if (user.id) {
      user.id = 'anonymous';
    }
    scrubbed.user = user;
  }

  if (scrubbed.exception?.values) {
    scrubbed.exception.values = scrubbed.exception.values.map(value => {
      if (value && typeof value.message === 'string') {
        return { ...value, message: sanitizeMessage(value.message) };
      }
      return value;
    });
  }

  return scrubbed;
}

export function filterSensitiveBreadcrumb(
  breadcrumb: SentryBreadcrumb
): SentryBreadcrumb | null {
  const result: SentryBreadcrumb = { ...breadcrumb };

  if (result.category === 'http' && typeof result.data?.url === 'string') {
    const url = result.data.url;
    if (
      url.includes('password') ||
      url.includes('token') ||
      url.includes('secret')
    ) {
      return null;
    }
  }

  if (
    result.category === 'ui.input' &&
    typeof result.message === 'string' &&
    result.message.includes('password')
  ) {
    return null;
  }

  return result;
}
