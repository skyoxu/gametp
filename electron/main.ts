import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  session,
  protocol,
} from 'electron';
import { createSecureBrowserWindow, initializeSecurity } from './security';
import * as Sentry from '@sentry/node';
import { join, resolve as resolvePath } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

// English-only comments and logs. ASCII only.
// Minimal, safe Electron main process (Option A):
// - ADR-0002 baseline: sandbox, contextIsolation, nodeIntegration=false, webSecurity=true
// - Strict window.open/navigation handling
// - Early Sentry init (ADR-0003)

// Harden Chromium features early (before app ready)
try {
  app.commandLine.appendSwitch('disable-features', 'MediaStream,Geolocation');
  app.commandLine.appendSwitch('disable-notifications');
} catch {}

// Register privileged custom scheme for future app:// usage (must be before ready)
try {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        allowServiceWorkers: true,
      },
    },
  ]);
} catch {}

function ensureLogsDir(): string | null {
  try {
    const d = new Date();
    const day = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const p = join(process.cwd(), 'logs', day, 'electron');
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
    return p;
  } catch {
    return null;
  }
}

const LOG_DIR = ensureLogsDir();
function logLine(msg: string) {
  try {
    if (!LOG_DIR) return;
    writeFileSync(
      join(LOG_DIR, 'main.log'),
      `[${new Date().toISOString()}] ${msg}\n`,
      { flag: 'a' }
    );
  } catch {}
}

// Sentry init (safe if DSN missing)
try {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment:
      process.env.SENTRY_ENVIRONMENT || (process.env.CI ? 'ci' : 'development'),
    tracesSampleRate: 1.0,
    release: process.env.SENTRY_RELEASE,
  });
  console.log('[main] Sentry initialized');
  logLine('Sentry initialized');
} catch (e) {
  console.warn(
    '[main] Sentry init skipped:',
    (e as Error)?.message || String(e)
  );
  logLine('Sentry init skipped');
}

function createWindow() {
  const win = createSecureBrowserWindow({
    width: 1024,
    height: 768,
    show: true,
    webPreferences: {
      // Disable sensitive blink features for security-first defaults
      disableBlinkFeatures: 'MediaStream,Geolocation',
      // Note: if Notification permission persistence becomes an issue, consider
      // using a non-persist partition for tests. Kept default here for stability.
      preload: join(__dirname, 'preload.js'),
    },
  });

  // Security: deny all external new windows
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url).catch(() => undefined);
    }
    return { action: 'deny' };
  });

  // Security: block navigation away from our app
  win.webContents.on('will-navigate', (evt, url) => {
    if (!url.startsWith('app://') && !url.startsWith('file://')) {
      evt.preventDefault();
      // Only allow opening http/https links externally; deny other schemes
      if (/^https?:\/\//i.test(url)) {
        shell.openExternal(url).catch(() => undefined);
      }
    }
  });

  // Load via custom scheme if available, fallback to file
  try {
    // Use scheme with empty host (app:///index.html) to ensure relative asset URLs resolve to /assets/*
    const baseUrl = 'app:///index.html';
    const url =
      process.env.E2E_LIGHT === '1' ? `${baseUrl}?e2e-light=1` : baseUrl;
    void win.loadURL(url);
    logLine('Loaded app://index.html');
  } catch {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    if (existsSync(indexPath)) {
      void win.loadFile(indexPath);
      logLine(`Fallback load file: ${indexPath}`);
    } else {
      void win.loadURL('about:blank');
      logLine('Fallback about:blank (no dist/index.html)');
    }
  }

  return win;
}

app.whenReady().then(() => {
  // Register app:// file protocol pointing to dist/
  try {
    protocol.registerFileProtocol('app', (request, callback) => {
      try {
        const url = new URL(request.url);
        const host = url.hostname || '';
        const pathOnly = url.pathname || '';
        let resourcePath = `/${host}${pathOnly}`;
        const distRoot = join(process.cwd(), 'dist');

        // Default to index if root-like
        if (!host && (!pathOnly || pathOnly === '/' || pathOnly.endsWith('/')))
          resourcePath = '/index.html';

        // If the host part is "index.html" (URL looked like app://index.html/...),
        // strip it so that relative assets like "./assets/*" resolve to "/assets/*".
        if (host === 'index.html') {
          // If requesting exactly the document, map to /index.html
          if (!pathOnly || pathOnly === '/') {
            resourcePath = '/index.html';
          } else if (pathOnly.startsWith('/')) {
            resourcePath = pathOnly; // e.g., /assets/...
          }
        }

        // Also normalize any accidental /index.html/ prefix
        if (resourcePath.startsWith('/index.html/')) {
          resourcePath = resourcePath.replace('/index.html/', '/');
        }

        // Resolve and guard traversal; fallback to index.html if outside dist or missing
        const candidate = resolvePath(distRoot, `.${resourcePath}`);
        const safe =
          candidate.startsWith(distRoot) && existsSync(candidate)
            ? candidate
            : join(distRoot, 'index.html');

        callback({ path: safe });
      } catch {
        callback({ path: join(process.cwd(), 'dist', 'index.html') });
      }
    });
  } catch (e) {
    console.warn(
      '[protocol] registerFileProtocol failed',
      (e as Error)?.message
    );
  }
  try {
    initializeSecurity(session.defaultSession);
  } catch (e) {
    console.warn(
      '[main] security initialization skipped:',
      (e as Error)?.message
    );
  }
  const win = createWindow();
  logLine('BrowserWindow created');

  // Deny sensitive permission requests (camera/mic/geolocation/notifications)
  try {
    const ses = session.defaultSession;
    if (ses) {
      ses.setPermissionRequestHandler((_wc, permission, callback) => {
        const denyList = new Set([
          'media',
          'camera',
          'microphone',
          'geolocation',
          'notifications',
        ]);
        if (denyList.has(permission)) {
          callback(false);
          return;
        }
        callback(false);
      });
    }
  } catch {}

  // Optional test-only IPC helper
  if (process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
    ipcMain.handle('window:bring-to-front', () => {
      const target = BrowserWindow.getFocusedWindow() || win;
      if (target) {
        target.show();
        target.focus();
        return true;
      }
      return false;
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Windows-only template: always quit when all windows are closed
  app.quit();
});

// Crash diagnostics
app.on('render-process-gone', (_e, _wc, d) => {
  console.error('[main] render-process-gone:', d.reason, d.exitCode);
  logLine(`render-process-gone: ${d.reason} ${d.exitCode}`);
});
app.on('child-process-gone', (_e, d) => {
  console.error('[main] child-process-gone:', d.reason, d.exitCode);
  logLine(`child-process-gone: ${d.reason} ${d.exitCode}`);
});

// Note: If some runners persist a previously granted Notification permission,
// rely on request handler default-deny and Chromium flag `--disable-notifications`.
