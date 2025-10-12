/*
 * Electron permission and navigation policy manager
 * Implements least-privilege defaults per ADR-0002.
 */
import { BrowserWindow, session, shell } from 'electron';

interface SecurityConfig {
  allowedOrigins: string[];
  allowedPermissions: string[];
  allowedNavigationDomains: string[];
  allowedExternalDomains: string[];
}

/**
 * Production security configuration (strict)
 */
const PRODUCTION_SECURITY_CONFIG: SecurityConfig = {
  // Origins allowed to request permissions or access
  allowedOrigins: [
    'file://', // local app protocol
    // no external origins by default
  ],

  // Permissions allow-list (empty by default)
  allowedPermissions: [
    // add 'media', 'geolocation' as needed via updateConfig
  ],

  // Explicit navigation domains (block by default)
  allowedNavigationDomains: [],

  // External open allow-list
  allowedExternalDomains: ['github.com', 'docs.electron.com'],
};

/**
 * Development security configuration (relaxed for local work)
 */
const DEVELOPMENT_SECURITY_CONFIG: SecurityConfig = {
  allowedOrigins: [
    'file://',
    'http://localhost',
    'http://127.0.0.1',
    'https://localhost',
  ],

  allowedPermissions: ['media', 'geolocation', 'notifications'],

  allowedNavigationDomains: ['localhost', '127.0.0.1'],

  allowedExternalDomains: [
    'github.com',
    'docs.electron.com',
    'stackoverflow.com',
    'developer.mozilla.org',
  ],
};

class SecurityPolicyManager {
  private config: SecurityConfig;
  private isProduction: boolean;
  private auditLog: Array<{
    timestamp: string;
    type: 'permission' | 'navigation' | 'window-open' | 'web-request';
    action: 'allow' | 'deny';
    details: string;
  }> = [];

  constructor(isProduction: boolean = process.env.NODE_ENV === 'production') {
    this.isProduction = isProduction;
    this.config = isProduction
      ? PRODUCTION_SECURITY_CONFIG
      : DEVELOPMENT_SECURITY_CONFIG;

    console.log(
      `[Security] SecurityPolicyManager initialized (${isProduction ? 'production' : 'development'})`
    );
  }

  /**
   * Append an audit entry and mirror to console
   */
  private logSecurityEvent(
    type: 'permission' | 'navigation' | 'window-open' | 'web-request',
    action: 'allow' | 'deny',
    details: string
  ): void {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      action,
      details,
    };

    this.auditLog.push(event);

    // Keep audit log bounded to 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Structured console mirror (ASCII-only)
    console.log(`[SECURITY-${type.toUpperCase()}:${action}] ${details}`);
  }

  /**
   * Summarize audit data and compute a simple score
   */
  getSecurityAuditReport(): {
    totalEvents: number;
    allowedEvents: number;
    deniedEvents: number;
    recentEvents: Array<{
      timestamp: string;
      type: string;
      action: string;
      details: string;
    }>;
    securityScore: number;
  } {
    const totalEvents = this.auditLog.length;
    const allowedEvents = this.auditLog.filter(
      e => e.action === 'allow'
    ).length;
    const deniedEvents = this.auditLog.filter(e => e.action === 'deny').length;

    // Score: higher denied ratio => higher score (stricter)
    const securityScore =
      totalEvents > 0 ? Math.round((deniedEvents / totalEvents) * 100) : 100;

    return {
      totalEvents,
      allowedEvents,
      deniedEvents,
      recentEvents: this.auditLog.slice(-50), // last 50 entries
      securityScore,
    };
  }

  /**
   * Apply unified security policies to a window/session
   * Note: use the Session associated with the window (defaultSession in most apps)
   */
  applySecurityPolicies(
    window: BrowserWindow,
    ses: typeof session.defaultSession
  ): void {
    this.setupPermissionHandler(ses);
    this.setupNavigationHandler(window);
    this.setupWindowOpenHandler(window);
    this.setupWebRequestFiltering(ses);

    console.log('[Security] policies applied to window/session');
  }

  /**
   * Centralized permission request handling
   * Should be attached on session when ready
   */
  private setupPermissionHandler(ses: typeof session.defaultSession): void {
    ses.setPermissionRequestHandler(
      (_webContents, permission, callback, details) => {
        const requestingOrigin = new URL(details.requestingUrl).origin;

        // Check origin allow-list
        const isOriginAllowed = this.config.allowedOrigins.some(origin =>
          requestingOrigin.startsWith(origin)
        );

        // Check permission allow-list
        const isPermissionAllowed =
          this.config.allowedPermissions.includes(permission);

        // Treat these as sensitive in production (default deny)
        const sensitivePermissions = ['media', 'geolocation', 'notifications'];
        if (sensitivePermissions.includes(permission)) {
          // In production deny by default
          if (this.isProduction) {
            this.logSecurityEvent(
              'permission',
              'deny',
              `sensitive permission denied: ${permission} from ${requestingOrigin}`
            );
            callback(false);
            return;
          }
        }

        const shouldAllow = isOriginAllowed && isPermissionAllowed;

        // Audit
        this.logSecurityEvent(
          'permission',
          shouldAllow ? 'allow' : 'deny',
          `${permission} from ${requestingOrigin} (originAllowed: ${isOriginAllowed}, permissionAllowed: ${isPermissionAllowed})`
        );

        callback(shouldAllow);
      }
    );
  }

  /**
   * Navigation guard (top-level navigations and webview attachment)
   */
  private setupNavigationHandler(window: BrowserWindow): void {
    window.webContents.on('will-navigate', (event, navigationUrl) => {
      const targetOrigin = new URL(navigationUrl).origin;
      const targetHostname = new URL(navigationUrl).hostname;

      // Allow internal origins
      const isLocalNavigation = this.config.allowedOrigins.some(origin =>
        targetOrigin.startsWith(origin)
      );

      // Allow approved domains
      const isDomainAllowed = this.config.allowedNavigationDomains.some(
        domain =>
          targetHostname === domain || targetHostname.endsWith('.' + domain)
      );

      if (!isLocalNavigation && !isDomainAllowed) {
        this.logSecurityEvent(
          'navigation',
          'deny',
          `blocked navigation: ${navigationUrl} (hostname: ${targetHostname})`
        );
        event.preventDefault();

        // Optionally inform user
        // dialog.showErrorBox('Navigation blocked', `Host: ${targetHostname}`);
      } else {
        this.logSecurityEvent(
          'navigation',
          'allow',
          `navigation allowed: ${navigationUrl} (local: ${isLocalNavigation}, domainAllowed: ${isDomainAllowed})`
        );
      }
    });

    // webview attachment guard
    window.webContents.on(
      'will-attach-webview',
      (event, _webPreferences, params) => {
        const targetOrigin = new URL(params.src).origin;

        const isOriginAllowed = this.config.allowedOrigins.some(origin =>
          targetOrigin.startsWith(origin)
        );

        if (!isOriginAllowed) {
          this.logSecurityEvent(
            'navigation',
            'deny',
            `webview blocked: ${params.src} (origin: ${targetOrigin})`
          );
          event.preventDefault();
        } else {
          this.logSecurityEvent(
            'navigation',
            'allow',
            `webview: ${params.src}`
          );
        }
      }
    );
  }

  /**
   * External open guard (shell.openExternal allow-list)
   */
  private setupWindowOpenHandler(window: BrowserWindow): void {
    window.webContents.setWindowOpenHandler(({ url }) => {
      const targetHostname = new URL(url).hostname;

      // Allow only configured external domains
      const isExternalAllowed = this.config.allowedExternalDomains.some(
        domain =>
          targetHostname === domain || targetHostname.endsWith('.' + domain)
      );

      if (isExternalAllowed) {
        this.logSecurityEvent(
          'window-open',
          'allow',
          `external allowed: ${url} (hostname: ${targetHostname})`
        );
        shell.openExternal(url);
      } else {
        this.logSecurityEvent(
          'window-open',
          'deny',
          `external blocked: ${url} (hostname: ${targetHostname})`
        );
      }

      // Always deny creating a new in-app window
      return { action: 'deny' };
    });
  }

  /**
   * WebRequest filter (session-level)
   * Should be attached early when session is ready
   */
  private setupWebRequestFiltering(ses: typeof session.defaultSession): void {
    ses.webRequest.onBeforeRequest((details, callback) => {
      const url = new URL(details.url);

      // Allow local protocols
      if (
        url.protocol === 'file:' ||
        url.protocol === 'data:' ||
        url.protocol === 'blob:'
      ) {
        callback({ cancel: false });
        return;
      }

      // Check origin allow-list
      const isOriginAllowed = this.config.allowedOrigins.some(origin =>
        details.url.startsWith(origin)
      );

      if (!isOriginAllowed && this.isProduction) {
        this.logSecurityEvent(
          'web-request',
          'deny',
          `blocked request: ${details.url} (protocol: ${url.protocol})`
        );
        callback({ cancel: true });
      } else {
        if (!isOriginAllowed) {
          // In development allow but log
          this.logSecurityEvent(
            'web-request',
            'allow',
            `dev-allow request: ${details.url}`
          );
        }
        callback({ cancel: false });
      }
    });
  }

  /**
   * Update in-memory configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[Security] policy config updated');
  }

  /**
   * Safe copy of current configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Export audit summary and configuration snapshot
   */
  exportSecurityReport(): {
    timestamp: string;
    environment: 'production' | 'development';
    config: SecurityConfig;
    auditSummary: {
      totalEvents: number;
      allowedEvents: number;
      deniedEvents: number;
      recentEvents: Array<{
        timestamp: string;
        type: string;
        action: string;
        details: string;
      }>;
      securityScore: number;
    };
  } {
    return {
      timestamp: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development',
      config: this.getConfig(),
      auditSummary: this.getSecurityAuditReport(),
    };
  }

  /**
   * Clear audit log buffer
   */
  clearAuditLog(): void {
    const cleared = this.auditLog.length;
    this.auditLog = [];
    console.log(`[Security] audit log cleared (${cleared} entries)`);
  }
}

// Singleton instance
export const securityPolicyManager = new SecurityPolicyManager();
export { SecurityConfig, SecurityPolicyManager };
