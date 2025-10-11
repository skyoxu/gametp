/**
 * Note
 * ADR-0002/0005
 */

export function ensureString(v: unknown, name: string): string {
  if (typeof v !== 'string') throw new TypeError(`${name} must be a string`);
  return v;
}

export function ensureBoolean(v: unknown, name: string): boolean {
  if (typeof v !== 'boolean') throw new TypeError(`${name} must be a boolean`);
  return v;
}

export function ensurePlainObject<T = Record<string, unknown>>(
  v: unknown,
  name: string
): T {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw new TypeError(`${name} must be a plain object`);
  }
  return v as T;
}

/** IPC/*/
export function sanitizeChannel(name: string): string {
  const n = ensureString(name, 'channel');
  if (!/^[a-z][a-z0-9:_-]{2,63}$/i.test(n)) {
    throw new TypeError('channel contains invalid characters');
  }
  return n;
}
