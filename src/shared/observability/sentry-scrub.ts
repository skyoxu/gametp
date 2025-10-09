// Lightweight Sentry scrubbing helpers for unit tests and reuse.
// No Electron imports; keep types as any to avoid heavy deps in test env.

export function sanitizeMessage(message: string): string {
  return (message || '')
    .replace(/password[=:]\s*[^\s]+/gi, 'password=[REDACTED]')
    .replace(/token[=:]\s*[^\s]+/gi, 'token=[REDACTED]')
    .replace(/key[=:]\s*[^\s]+/gi, 'key=[REDACTED]')
    .replace(/secret[=:]\s*[^\s]+/gi, 'secret=[REDACTED]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_NUMBER]');
}

export function filterPIIWithOTelSemantics(event: any, _hint?: any): any {
  const e = event || {};
  if (e.request?.headers) {
    delete e.request.headers['authorization'];
    delete e.request.headers['cookie'];
    delete e.request.headers['x-api-key'];
  }
  if (e.user) {
    delete e.user.email;
    delete e.user.ip_address;
    if (e.user.id) e.user.id = 'anonymous';
  }
  if (e.exception?.values) {
    e.exception.values.forEach((ex: any) => {
      if (ex && typeof ex.message === 'string') {
        ex.message = sanitizeMessage(ex.message);
      }
    });
  }
  return e;
}

export function filterSensitiveBreadcrumb(breadcrumb: any): any {
  const b = { ...(breadcrumb || {}) };
  if (b.category === 'http' && b.data?.url) {
    const url: string = b.data.url;
    if (
      url.includes('password') ||
      url.includes('token') ||
      url.includes('secret')
    ) {
      return null;
    }
  }
  if (
    b.category === 'ui.input' &&
    typeof b.message === 'string' &&
    b.message.includes('password')
  ) {
    return null;
  }
  return b;
}
