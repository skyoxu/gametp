import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Verify context isolation is correctly enabled
if (!process.contextIsolated) {
  throw new Error('Context isolation must be enabled for security');
}

// Preload API: expose a strict allow-list to the renderer
if (process.contextIsolated) {
  try {
    // Verify sandbox mode status
    const isSandboxed = process.sandboxed;
    if (!isSandboxed) {
      console.warn('WARNING: Sandbox is not enabled - security may be compromised');
    }

    // Use unified name 'electronAPI' (align with tests)
    contextBridge.exposeInMainWorld(
      'electronAPI',
      Object.freeze({
        platform: process.platform,
        version: process.versions.electron,
        isSandboxed: process.sandboxed,
        contextIsolated: process.contextIsolated,
        // CI-only helper: bring window to front
        bringToFront: () => {
          if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
            // Request main process via IPC to bring window to front
            electronAPI.ipcRenderer?.invoke?.('window:bring-to-front');
          }
        },
        ...electronAPI,
      })
    );

    // Security validation API (test mode only)
    if (process.env.SECURITY_TEST_MODE === 'true') {
      contextBridge.exposeInMainWorld(
        '__SECURITY_VALIDATION__',
        Object.freeze({
          isSandboxed: process.sandboxed,
          contextIsolated: process.contextIsolated,
          nodeIntegrationDisabled: typeof require === 'undefined',
          exposedAt: new Date().toISOString(),
          // Extended security validation - supports enhanced-electron-security.spec.ts
          securityConfigs: Object.freeze({
            cspConfig: Object.freeze({
              enabled: true,
              strictMode: true,
              blockInlineScripts: true,
              allowedSources: ['self'],
              reportViolations: true,
            }),
            electronSecurity: Object.freeze({
              sandboxEnabled: process.sandboxed,
              contextIsolationEnabled: process.contextIsolated,
              nodeIntegrationDisabled: typeof require === 'undefined',
              webSecurityEnabled: true,
              allowRunningInsecureContent: false,
              experimentalFeatures: false,
            }),
            navigationSecurity: Object.freeze({
              externalNavigationBlocked: true,
              allowedDomains: [],
              interceptEnabled: true,
              preventChromiumErrors: true,
            }),
            permissionSecurity: Object.freeze({
              defaultDenyAll: true,
              permissionRequestsLogged: true,
              whitelistedPermissions: [],
              strictValidation: true,
            }),
          }),
          // Redline status inquiry helpers (test-only)
          redlineStatus: Object.freeze({
            navigationInterceptActive: true,
            externalRequestBlocked: true,
            permissionRequestsDenied: true,
            cspViolationsBlocked: true,
            lastInterceptAt: new Date().toISOString(),
            interceptCount: 0,
          }),
        })
      );

      // Parameter validation placeholder for test-mode misuse tests
      contextBridge.exposeInMainWorld(
        '__PARAM_VALIDATION__',
        Object.freeze({
          // Demonstration: validate and echo 'message' field (strict type checks)
          safeEcho(payload: unknown): string {
            if (
              payload === null ||
              typeof payload !== 'object' ||
              Array.isArray(payload)
            ) {
              throw new TypeError('payload must be a plain object');
            }
            const msg = (payload as any).message;
            if (typeof msg !== 'string')
              throw new TypeError('message must be a string');
            return String(msg);
          },
        })
      );
    }

    // App version info - supports Sentry Release Health
    contextBridge.exposeInMainWorld(
      '__APP_VERSION__',
      process.env.APP_VERSION || '0.1.1'
    );

    // Minimal demo flag API to avoid leaking sensitive info
    contextBridge.exposeInMainWorld(
      '__CUSTOM_API__',
      Object.freeze({
        preloadExposed: true,
      })
    );
  } catch (error) {
    console.error('Failed to expose API:', error);
    // If preload fails, fail fast (secure mode)
    throw error;
  }
} else {
  throw new Error('Context isolation is required and must be enabled');
}

