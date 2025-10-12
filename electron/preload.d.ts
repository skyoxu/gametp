/* Preload script API type definitions */
import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI & {
      // Basic system info
      platform: NodeJS.Platform;
      version: string;
      isSandboxed: boolean;
      contextIsolated: boolean;
    };

    // Application version info
    __APP_VERSION__: string;

    // Minimal custom API marker
    __CUSTOM_API__: {
      preloadExposed: boolean;
    };

    // Security validation API (test mode only)
    __SECURITY_VALIDATION__?: {
      isSandboxed: boolean;
      contextIsolated: boolean;
      nodeIntegrationDisabled: boolean;
      exposedAt: string;
    };
  }
}

export {};
