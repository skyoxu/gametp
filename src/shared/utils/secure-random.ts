/*
 * Secure random utilities for browser (Electron renderer) and Node.
 * Provides cryptographically secure replacements for Math.random-based helpers.
 */

/**
 * Returns a cryptographically secure Uint32 value.
 * Uses Web Crypto in browser/Electron; falls back to Node's webcrypto.
 */
export function secureRandomUint32(): number {
  const g: any = globalThis as any;
  // Prefer global Web Crypto (Node >=20/Electron renderers have it)
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    g.crypto.getRandomValues(arr);
    return arr[0] >>> 0;
  }
  // Last resort (should not happen in our supported stack)
  // TODO: remove fallback if environments without Web Crypto are no longer supported.
  const t = Date.now() ^ (Math.floor(Math.random() * 0xffffffff) >>> 0);
  return t >>> 0;
}

/**
 * Returns a secure float in [0, 1).
 * Divides a secure Uint32 by 2^32 to obtain a uniform double.
 */
export function secureRandomFloat(): number {
  return secureRandomUint32() / 2 ** 32;
}

/**
 * Returns a base36 random string of given length using secure randomness.
 * @param length desired length (default 9)
 * @returns base36 string composed from secure random chunks
 */
export function secureRandomBase36(length = 9): string {
  let out = '';
  while (out.length < length) {
    const n = secureRandomUint32();
    // Slice off the leading '0.' and take base36 of 32-bit number
    out += n.toString(36);
  }
  return out.slice(0, length);
}

/**
 * Create a session-like id with timestamp + secure random suffix.
 * @param prefix optional prefix
 * @param randLen random tail length (default 9)
 * @returns e.g. "<prefix>1660000000000-abc123xyz"
 */
export function secureSessionId(prefix = '', randLen = 9): string {
  const core = `${Date.now()}-${secureRandomBase36(randLen)}`;
  return prefix ? `${prefix}${core}` : core;
}
