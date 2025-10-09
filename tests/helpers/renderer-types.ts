export interface RendererWindow extends Window {
  electronAPI?: Record<string, unknown>;
  electron?: unknown;
  __CUSTOM_API__?: Record<string, unknown>;
  __force_error__?: () => void;
  testCSP?: boolean;
  require?: unknown;
  process?: unknown;
  Buffer?: unknown;
  global?: unknown;
  setImmediate?: unknown;
  clearImmediate?: unknown;
}

export interface RendererNodeGlobalsSnapshot {
  hasRequire: boolean;
  hasProcess: boolean;
  hasBuffer: boolean;
  hasGlobal: boolean;
  hasSetImmediate: boolean;
  hasClearImmediate: boolean;
}

export interface RendererDiagnostics {
  allWindowKeys: string[];
  exposedApiKeys: string[];
  electronAPIType: string;
  customAPIType: string;
  electronKeys: string[];
  customKeys: string[];
}

export interface AppStatusInfo {
  isReady: boolean;
  isPackaged: boolean;
  windowCount: number;
}

export interface RuntimeEnvironmentInfo {
  appName: string;
  appVersion: string;
  isReady: boolean;
  isPackaged: boolean;
  processVersion: string;
  nodeVersion: string;
  platform: NodeJS.Platform;
  arch: string;
  nodeEnv: string;
  checkedAt: string;
}
