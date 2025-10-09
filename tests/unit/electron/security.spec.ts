import { describe, it, expect, vi } from 'vitest';
import type { BrowserWindow } from 'electron';

vi.mock('electron', () => ({
  BrowserWindow: class {},
  session: {
    defaultSession: {
      webRequest: { onHeadersReceived: vi.fn(), onBeforeRequest: vi.fn() },
    },
  },
  app: { on: vi.fn() },
  shell: { openExternal: vi.fn() },
}));

import {
  _isAllowedNavigation,
  validateSecurityConfig,
  getSecurityHealthCheck,
} from '../../../electron/security';

interface BrowserWindowLike {
  webContents: {
    browserWindowOptions: {
      webPreferences: {
        nodeIntegration: boolean;
        contextIsolation: boolean;
        sandbox: boolean;
        webSecurity: boolean;
        allowRunningInsecureContent: boolean;
        experimentalFeatures: boolean;
      };
    };
  };
}

describe('electron/security', () => {
  it('allows only app://, file://, and localhost/127.0.0.1', () => {
    expect(_isAllowedNavigation('app://index.html')).toBe(true);
    expect(_isAllowedNavigation('file://C:/app/index.html')).toBe(true);
    expect(_isAllowedNavigation('http://localhost:5173')).toBe(true);
    expect(_isAllowedNavigation('http://127.0.0.1:3000')).toBe(true);
    expect(_isAllowedNavigation('https://example.com')).toBe(false);
  });

  it('validates secure BrowserWindow preferences', () => {
    const fakeWindow: BrowserWindowLike = {
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
    };

    const cfg = validateSecurityConfig(fakeWindow as unknown as BrowserWindow);
    expect(cfg.nodeIntegration).toBe(false);
    expect(cfg.contextIsolation).toBe(true);
    expect(cfg.sandbox).toBe(true);
    expect(cfg.webSecurity).toBe(true);
    expect(cfg.allowRunningInsecureContent).toBe(false);
  });

  it('computes compliant security health check', () => {
    const fakeWindow: BrowserWindowLike = {
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
    };

    const report = getSecurityHealthCheck(
      fakeWindow as unknown as BrowserWindow
    );
    expect(report.compliant).toBe(true);
    expect(report.violations.length).toBe(0);
    expect(report.score).toBe(100);
  });
});
