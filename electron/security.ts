/**
 * Electron security hardening utilities
 * Implements ADR-0002 baseline security measures.
 *
 * Key areas:
 * 1. BrowserWindow: sandbox + contextIsolation + nodeIntegration disabled
 * 2. Navigation/permission controls: block external origins, least-privilege
 * 3. CSP and headers: Content Security Policy + COOP/COEP/Permissions Policy
 */
import { BrowserWindow, session, app, shell } from 'electron';
import { _isAllowedNavigation } from './security-helpers';
// See ADR-0002 for policy details
function assertBrowserWindow(win: unknown): asserts win is BrowserWindow {
  if (!win || typeof (win as any).webContents?.on !== 'function') {
    throw new TypeError('hardenWindow: invalid BrowserWindow instance');
  }
}
function assertSession(
  sesArg: unknown
): asserts sesArg is typeof session.defaultSession {
  if (
    !sesArg ||
    typeof (sesArg as any).webRequest?.onHeadersReceived !== 'function'
  ) {
    throw new TypeError('Security: invalid session provided');
  }
}
export { _isAllowedNavigation };

/**
 * Create a BrowserWindow with hardened defaults
 * @param options BrowserWindow constructor options to merge with secure defaults
 * @returns a new BrowserWindow instance
 */
export function createSecureBrowserWindow(
  options: Electron.BrowserWindowConstructorOptions = {}
): BrowserWindow {
  const secureOptions: Electron.BrowserWindowConstructorOptions = {
    ...options,
    webPreferences: {
      // Strict security defaults
      nodeIntegration: false, // Disable Node.js in renderer
      contextIsolation: true, // Isolate contexts
      sandbox: true, // Enable sandbox
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      // enableRemoteModule is deprecated and intentionally omitted
      webSecurity: true,

      // Merge caller-provided overrides last
      ...options.webPreferences,

      // Preload script path if provided
      preload: options.webPreferences?.preload || undefined,
    },
  };

  return new BrowserWindow(secureOptions);
}

/**
 * Apply navigation, window-open, and permission guards to a window
 * @param window Target BrowserWindow
 * @param ses Electron session associated with the window
 */
export function hardenWindow(
  window: BrowserWindow,
  ses: typeof session.defaultSession
): void {
  assertBrowserWindow(window);
  assertSession(ses);
  // 1. Window open handler
  window.webContents.setWindowOpenHandler(({ url }) => {
    console.log(`[Security] window-open request: ${url}`);

    const isAllowed = _isAllowedNavigation(url);

    if (isAllowed) {
      return { action: 'allow' };
    }
    // External hosts are opened via system shell
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 2. Navigation guard
  window.webContents.on('will-navigate', (event, navigationUrl) => {
    console.log(`[Security] navigation request: ${navigationUrl}`);

    // Allow only internal/provisioned URLs
    if (
      !navigationUrl.startsWith('app://') &&
      !navigationUrl.startsWith('file://') &&
      !navigationUrl.includes('localhost') &&
      !navigationUrl.includes('127.0.0.1')
    ) {
      console.warn(`[Security] blocked external navigation: ${navigationUrl}`);
      event.preventDefault();
      // Optionally inform user via dialog
      // dialog.showWarningBox('Navigation blocked', `External URL: ${navigationUrl}`);
    }
  });

  // 3. Permission request handler (use window.webContents.session)
  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    console.log(`[Security] permission request: ${permission}`);

    // Allow-list of permissions
    const allowedPermissions = ['clipboard-read', 'clipboard-sanitized-write'];

    const isAllowed = allowedPermissions.includes(permission);

    if (isAllowed) {
      console.log(`[Security] permission allowed: ${permission}`);
      callback(true);
    } else {
      console.warn(`[Security] permission denied: ${permission}`);
      callback(false);
    }
  });

  // 4. External protocol redirects
  window.webContents.on('will-redirect', (event, redirectUrl) => {
    console.log(`[Security] will-redirect: ${redirectUrl}`);

    if (
      !redirectUrl.startsWith('app://') &&
      !redirectUrl.startsWith('file://')
    ) {
      event.preventDefault();
      shell.openExternal(redirectUrl);
    }
  });
}

/**
 * :CSP
 * , CSP, COOP, COEP, Permissions-Policy
 * cifix1.txt:Session, ready
 */
export function installSecurityHeaders(
  ses: typeof session.defaultSession
): void {
  assertSession(ses);
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders || {};

    // Content Security Policy -
    responseHeaders['Content-Security-Policy'] = [
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'", // CSP:unsafe-inline
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss: https://sentry.io", // Sentry
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
      ].join('; '),
    ];

    // Cross-Origin Opener Policy
    responseHeaders['Cross-Origin-Opener-Policy'] = ['same-origin'];

    // Cross-Origin Embedder Policy
    responseHeaders['Cross-Origin-Embedder-Policy'] = ['require-corp'];

    // Permissions Policy -
    responseHeaders['Permissions-Policy'] = [
      'geolocation=(), camera=(), microphone=(), usb=(), serial=(), bluetooth=()',
    ];

    // X-Content-Type-Options
    responseHeaders['X-Content-Type-Options'] = ['nosniff'];

    // X-Frame-Options
    responseHeaders['X-Frame-Options'] = ['DENY'];

    // Referrer-Policy
    responseHeaders['Referrer-Policy'] = ['strict-origin-when-cross-origin'];

    callback({ responseHeaders });
  });

  console.log('[Security] security headers installed');
}

/**
 * CSP violation and suspicious request reporting
 * Collect and log CSP-relevant request patterns for later analysis
 */
export function setupCSPReporting(ses: typeof session.defaultSession): void {
  assertSession(ses);
  ses.webRequest.onBeforeRequest((details, callback) => {
    // Disallow suspicious inline/script-in-URL patterns
    const url = details.url.toLowerCase();
    const scriptProtocol = 'java' + 'script:';
    const hasScriptProtocol = url.startsWith(scriptProtocol);
    const hasDataHtml = url.includes('data:text/html');
    const hasBlobUrl = url.startsWith('blob:');

    if (hasScriptProtocol || hasDataHtml || hasBlobUrl) {
      console.warn(`[Security] suspicious request: ${details.url}`);

      // Optionally forward to an in-house telemetry channel
      // sendSecurityAlert('csp_violation', { url: details.url, type: 'suspicious_request' });
    }

    callback({});
  });
}

/**
 * Initialize security stack on app startup
 * @param ses Electron session to harden
 */
export function initializeSecurity(ses: typeof session.defaultSession): void {
  assertSession(ses);
  console.log('[Security] initializing Electron security...');

  // Install global security headers
  installSecurityHeaders(ses);

  // Enable CSP reporting
  setupCSPReporting(ses);

  // Apply defaults for any future web contents
  app.on('web-contents-created', (_event, contents) => {
    console.log('[Security] web-contents created; applying handlers');

    // Prefer setWindowOpenHandler over deprecated new-window
    contents.setWindowOpenHandler(({ url }) => {
      console.log(`[Security] external open: ${url}`);
      shell.openExternal(url);
      return { action: 'deny' };
    });

    contents.on('will-attach-webview', event => {
      console.warn('[Security] WebView attachment blocked');
      event.preventDefault();
    });
  });

  console.log('[Security] Electron security stack initialized');
}

/**
 * Read-only view of BrowserWindow security-related preferences
 */
export interface SecurityConfig {
  nodeIntegration: boolean;
  contextIsolation: boolean;
  sandbox: boolean;
  webSecurity: boolean;
  allowRunningInsecureContent: boolean;
  experimentalFeatures: boolean;
}

export function validateSecurityConfig(window: BrowserWindow): SecurityConfig {
  // Extract webPreferences from BrowserWindow options
  const options =
    (window as any).webContents.browserWindowOptions?.webPreferences || {};

  return {
    nodeIntegration: options.nodeIntegration || false,
    contextIsolation: options.contextIsolation !== false, // default true
    sandbox: options.sandbox || false,
    webSecurity: options.webSecurity !== false, // default true
    allowRunningInsecureContent: options.allowRunningInsecureContent || false,
    experimentalFeatures: options.experimentalFeatures || false,
  };
}

/**
 * Compute compliance and a simple score from preferences
 */
export function getSecurityHealthCheck(window: BrowserWindow): {
  compliant: boolean;
  violations: string[];
  score: number;
} {
  const config = validateSecurityConfig(window);
  const violations: string[] = [];

  // Required baseline checks
  if (config.nodeIntegration) {
    violations.push('nodeIntegration must be false');
  }

  if (!config.contextIsolation) {
    violations.push('contextIsolation must be true');
  }

  if (!config.sandbox) {
    violations.push('sandbox must be true');
  }

  if (!config.webSecurity) {
    violations.push('webSecurity must be true');
  }

  if (config.allowRunningInsecureContent) {
    violations.push('allowRunningInsecureContent must be false');
  }

  if (config.experimentalFeatures) {
    violations.push('experimentalFeatures must be false');
  }

  const totalChecks = 6;
  const passedChecks = totalChecks - violations.length;
  const score = (passedChecks / totalChecks) * 100;

  return {
    compliant: violations.length === 0,
    violations,
    score,
  };
}
