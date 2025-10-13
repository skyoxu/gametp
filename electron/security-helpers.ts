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
  const allowedProtocols = ['app://', 'file://']
  const allowedDomains = ['localhost', '127.0.0.1']
  return (
    allowedProtocols.some((p) => url.startsWith(p)) ||
    allowedDomains.some((d) => url.includes(d))
  )
}

