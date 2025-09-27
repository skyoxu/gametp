import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock electron module to avoid requiring a real Electron runtime
vi.mock('electron', () => {
  return {
    BrowserWindow: class {},
    session: { defaultSession: { webRequest: { onHeadersReceived: vi.fn(), onBeforeRequest: vi.fn() } } },
    app: { on: vi.fn() },
    shell: { openExternal: vi.fn() },
  };
});

import { _isAllowedNavigation, validateSecurityConfig, getSecurityHealthCheck } from '../../../electron/security';

describe('electron/security', () => {
  it('allows only app://, file://, and localhost/127.0.0.1', () => {
    expect(_isAllowedNavigation('app://index.html')).toBe(true);
    expect(_isAllowedNavigation('file://C:/app/index.html')).toBe(true);
    expect(_isAllowedNavigation('http://localhost:5173')).toBe(true);
    expect(_isAllowedNavigation('http://127.0.0.1:3000')).toBe(true);
    expect(_isAllowedNavigation('https://example.com')).toBe(false);
  });

  it('validates secure BrowserWindow preferences', () => {
    const fakeWindow = {
      webContents: {
        browserWindowOptions: {
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
          },
        },
      },
    } as any;

    const cfg = validateSecurityConfig(fakeWindow);
    expect(cfg.nodeIntegration).toBe(false);
    expect(cfg.contextIsolation).toBe(true);
    expect(cfg.sandbox).toBe(true);
    expect(cfg.webSecurity).toBe(true);
    expect(cfg.allowRunningInsecureContent).toBe(false);
  });

  it('computes compliant security health check', () => {
    const fakeWindow = {
      webContents: {
        browserWindowOptions: {
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
          },
        },
      },
    } as any;

    const report = getSecurityHealthCheck(fakeWindow);
    expect(report.compliant).toBe(true);
    expect(report.violations.length).toBe(0);
    expect(report.score).toBe(100);
  });
});

