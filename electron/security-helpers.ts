/**
 * Pure security helpers that do not import Electron.
 * Extracted to enable unit tests to run without Electron binaries.
 *
 * ADR references:
 * - ADR-0002-electron-security (navigation allow/block rules)
 * - ADR-0005-quality-gates (testability without external binaries)
 */

/**
 * Check whether a navigation URL is allowed under baseline policy.
 * @param url string URL to check
 * @returns boolean true if allowed, otherwise false
 */
export function _isAllowedNavigation(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const raw = url.trim();
  const lower = raw.toLowerCase();

  // Disallow dangerous schemes outright
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:')
  ) {
    return false;
  }

  // Allow packaged/bundled resources and local files
  if (lower.startsWith('app://') || lower.startsWith('file://')) {
    return true;
  }

  // Strictly allow local dev servers over http/https
  try {
    const u = new URL(raw);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      const host = u.hostname; // normalized hostname (no brackets)
      return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    }
  } catch {
    // If URL parsing fails, deny by default
    return false;
  }

  return false;
}
