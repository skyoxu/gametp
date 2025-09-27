/**
 * Electron
 * :02-(Electron)-v2.md
 * ADR: ADR-0002 (Electron), ADR-0005 ()
 *
 * ElectronTypeScript,
 * .
 */

// =============================================================================
//
// =============================================================================

/**
 * Electron
 * :nodeIntegration=false, contextIsolation=true, sandbox=true
 */
export interface SafeWindowOptions {
  readonly nodeIntegration: false; // :false
  readonly contextIsolation: true; // :true
  readonly sandbox: true; // :true
  readonly webSecurity: true; // Web
  readonly allowRunningInsecureContent: false; //
  readonly experimentalFeatures?: false; // :
  readonly enableBlinkFeatures?: never; // Blink
  readonly preload?: string; // :
  readonly partition?: string; // :
  readonly session?: never; // session
  readonly nodeIntegrationInWorker?: false; // WorkerNode
  readonly nodeIntegrationInSubFrames?: false; // Node
}

/**
 * :
 */
export type SecurityConfigValidator<T> = T extends SafeWindowOptions
  ? T
  : never;

/**
 *
 */
export type ValidSecurityConfig = SecurityConfigValidator<SafeWindowOptions>;

// =============================================================================
// CSP (Content Security Policy)
// =============================================================================

/**
 * CSP
 */
export type CspDirectiveName =
  | 'default-src'
  | 'script-src'
  | 'style-src'
  | 'img-src'
  | 'font-src'
  | 'connect-src'
  | 'media-src'
  | 'object-src'
  | 'child-src'
  | 'frame-src'
  | 'worker-src'
  | 'manifest-src'
  | 'base-uri'
  | 'form-action'
  | 'frame-ancestors';

/**
 * CSP
 */
export type CspValue =
  | "'self'"
  | "'none'"
  | "'unsafe-inline'"
  | "'unsafe-eval'"
  | 'data:'
  | 'blob:'
  | 'ws:'
  | 'wss:'
  | string; // URL

/**
 * CSP
 */
export interface CspDirective {
  readonly name: CspDirectiveName;
  readonly values: readonly CspValue[];
  readonly allowUnsafe?: boolean;
}

/**
 * CSP
 */
export interface CSPPolicy {
  readonly directives: readonly CspDirective[];
  readonly environment: 'development' | 'production' | 'test';
  readonly reportUri?: string;
  readonly reportTo?: string;
  readonly upgradeInsecureRequests?: boolean;
  readonly blockAllMixedContent?: boolean;
}

/**
 * CSP
 */
export const PRODUCTION_CSP_POLICY: CSPPolicy = {
  environment: 'production',
  reportUri: '/api/csp-report',
  upgradeInsecureRequests: true,
  blockAllMixedContent: true,
  directives: [
    { name: 'default-src', values: ["'self'"] },
    { name: 'script-src', values: ["'self'"] },
    { name: 'style-src', values: ["'self'", "'unsafe-inline'"] }, // Tailwind CSS
    { name: 'img-src', values: ["'self'", 'data:', 'blob:'] },
    { name: 'font-src', values: ["'self'", 'data:'] },
    { name: 'connect-src', values: ["'self'", 'wss:'] },
    { name: 'media-src', values: ["'self'", 'blob:'] },
    { name: 'object-src', values: ["'none'"] },
    { name: 'child-src', values: ["'none'"] },
    { name: 'frame-src', values: ["'none'"] },
    { name: 'worker-src', values: ["'self'"] },
    { name: 'base-uri', values: ["'self'"] },
    { name: 'form-action', values: ["'none'"] },
    { name: 'frame-ancestors', values: ["'none'"] },
  ],
} as const;

/**
 * CSP
 */
export interface CspViolationReport {
  readonly documentUri: string;
  readonly referrer: string;
  readonly violatedDirective: string;
  readonly effectiveDirective: string;
  readonly originalPolicy: string;
  readonly disposition: string;
  readonly blockedUri: string;
  readonly statusCode: number;
  readonly timestamp: number;
  readonly lineNumber?: number;
  readonly columnNumber?: number;
  readonly sourceFile?: string;
}

// =============================================================================
// IPC (Inter-Process Communication)
// =============================================================================

/**
 * IPC
 */
export type IpcChannelNamespace =
  | 'app'
  | 'game'
  | 'telemetry'
  | 'security'
  | 'system';

/**
 * IPC
 */
export type IpcChannelAction = string;

/**
 * IPC(:)
 */
export type IpcChannelName = `${IpcChannelNamespace}:${IpcChannelAction}`;

/**
 * IPC
 */
export interface IpcRequest<TPayload = unknown> {
  readonly channel: IpcChannelName;
  readonly payload: TPayload;
  readonly requestId?: string;
  readonly timestamp?: number;
}

/**
 * IPC
 */
export interface IpcResponse<TData = unknown> {
  readonly success: boolean;
  readonly data?: TData;
  readonly error?: string;
  readonly requestId?: string;
  readonly timestamp: number;
}

/**
 * IPC
 */
export interface IpcContract<TRequest = unknown, TResponse = unknown> {
  readonly channel: IpcChannelName;
  readonly requestSchema?: TRequest;
  readonly responseSchema?: TResponse;
  readonly timeout?: number;
  readonly rateLimit?: {
    readonly maxRequests: number;
    readonly windowMs: number;
  };
}

/**
 * API
 */
export interface PreloadExportsWhitelist {
  readonly app: {
    readonly getVersion: () => Promise<string>;
    readonly getPlatform: () => Promise<NodeJS.Platform>;
    readonly getLocale: () => Promise<string>;
    readonly getName: () => Promise<string>;
  };

  readonly game: {
    readonly save: (data: unknown) => Promise<IpcResponse<boolean>>;
    readonly load: () => Promise<IpcResponse<unknown>>;
    readonly exportData: (format: 'json' | 'csv') => Promise<IpcResponse<Blob>>;
    readonly importData: (
      data: string,
      format: 'json' | 'csv'
    ) => Promise<IpcResponse<boolean>>;
  };

  readonly telemetry: {
    readonly track: (
      event: string,
      properties?: Record<string, unknown>
    ) => Promise<IpcResponse<void>>;
    readonly flush: () => Promise<IpcResponse<void>>;
    readonly setUserId: (userId: string) => Promise<IpcResponse<void>>;
  };

  readonly security: {
    readonly reportViolation: (
      violation: SecurityViolation
    ) => Promise<IpcResponse<void>>;
    readonly getSecurityStatus: () => Promise<IpcResponse<SecurityStatus>>;
    readonly updateSecurityPolicy: (
      policy: Partial<SecurityPolicy>
    ) => Promise<IpcResponse<boolean>>;
  };
}

// =============================================================================
//
// =============================================================================

/**
 *
 */
export type SecurityViolationType =
  | 'csp-violation'
  | 'unauthorized-navigation'
  | 'popup-blocked'
  | 'unsafe-script-execution'
  | 'node-api-access-attempt'
  | 'ipc-rate-limit-exceeded'
  | 'unauthorized-ipc-channel'
  | 'preload-injection-attempt';

/**
 *
 */
export interface SecurityViolation {
  readonly type: SecurityViolationType;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: number;
  readonly userAgent?: string;
  readonly url?: string;
  readonly stackTrace?: string;
}

/**
 *
 */
export interface SecurityStatus {
  readonly secure: boolean;
  readonly violations: {
    readonly total: number;
    readonly byType: Record<SecurityViolationType, number>;
    readonly bySeverity: Record<'low' | 'medium' | 'high' | 'critical', number>;
    readonly recent: readonly SecurityViolation[];
  };
  readonly lastCheck: number;
  readonly configurationValid: boolean;
  readonly activePolicies: readonly string[];
}

/**
 *
 */
export interface SecurityPolicy {
  readonly csp: CSPPolicy;
  readonly windowConfig: SafeWindowOptions;
  readonly ipcWhitelist: readonly IpcChannelName[];
  readonly rateLimits: Record<
    string,
    { maxRequests: number; windowMs: number }
  >;
  readonly logging: {
    readonly enabled: boolean;
    readonly level: 'debug' | 'info' | 'warn' | 'error';
    readonly reportViolations: boolean;
  };
}

// =============================================================================
//
// =============================================================================

/**
 *
 */
export type SecurityGateStatus = 'pass' | 'fail' | 'warning' | 'pending';

/**
 *
 */
export interface SecurityGateResult {
  readonly name: string;
  readonly status: SecurityGateStatus;
  readonly score?: number;
  readonly details: readonly string[];
  readonly timestamp: number;
  readonly requirement?: string;
}

/**
 *
 */
export interface SecurityAuditResult {
  readonly overall: SecurityGateStatus;
  readonly gates: readonly SecurityGateResult[];
  readonly summary: {
    readonly passed: number;
    readonly failed: number;
    readonly warnings: number;
    readonly total: number;
  };
  readonly recommendations: readonly string[];
  readonly timestamp: number;
}

// =============================================================================
//
// =============================================================================

/**
 *
 */
export type ConfigValidator<T> = (config: T) => {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
};

/**
 *
 */
export type SecurityConfigValidator_Fn = ConfigValidator<SafeWindowOptions>;

/**
 * CSP
 */
export type CspConfigValidator = ConfigValidator<CSPPolicy>;

/**
 * IPC
 */
export type IpcConfigValidator = ConfigValidator<readonly IpcChannelName[]>;

// =============================================================================
//
// =============================================================================

/**
 *
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 *
 */
export type ImmutableSecurityConfig = DeepReadonly<SecurityPolicy>;

/**
 * ()
 */
export type PartialSecurityConfig = Partial<{
  [K in keyof SecurityPolicy]: Partial<SecurityPolicy[K]>;
}>;

// =============================================================================
//
// =============================================================================

/**
 * IPC
 */
export const DEFAULT_IPC_WHITELIST: readonly IpcChannelName[] = [
  'app:getVersion',
  'app:getPlatform',
  'app:getLocale',
  'app:getName',
  'game:save',
  'game:load',
  'game:exportData',
  'game:importData',
  'telemetry:track',
  'telemetry:flush',
  'telemetry:setUserId',
  'security:reportViolation',
  'security:getSecurityStatus',
  'system:ping',
] as const;

/**
 *
 */
export const DEFAULT_RATE_LIMITS: Record<
  string,
  { maxRequests: number; windowMs: number }
> = {
  'app:*': { maxRequests: 10, windowMs: 60000 }, // :10
  'game:*': { maxRequests: 30, windowMs: 60000 }, // :30
  'telemetry:*': { maxRequests: 100, windowMs: 60000 }, // :100
  'security:*': { maxRequests: 20, windowMs: 60000 }, // :20
  'system:*': { maxRequests: 5, windowMs: 60000 }, // :5
} as const;

/**
 *
 */
export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  csp: PRODUCTION_CSP_POLICY,
  windowConfig: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
  },
  ipcWhitelist: DEFAULT_IPC_WHITELIST,
  rateLimits: DEFAULT_RATE_LIMITS,
  logging: {
    enabled: true,
    level: 'warn',
    reportViolations: true,
  },
} as const;

// =============================================================================
//  (,)
// =============================================================================

// :,
// :
// - : SafeWindowOptions, ValidSecurityConfig
// - CSP: CspDirectiveName, CspValue, CspDirective, CSPPolicy, CspViolationReport
// - IPC: IpcChannelNamespace, IpcChannelAction, IpcChannelName, IpcRequest, IpcResponse, IpcContract, PreloadExportsWhitelist
// - : SecurityViolationType, SecurityViolation, SecurityStatus, SecurityPolicy
// - : SecurityGateStatus, SecurityGateResult, SecurityAuditResult
// - : ConfigValidator, SecurityConfigValidator_Fn, CspConfigValidator, IpcConfigValidator
// - : DeepReadonly, ImmutableSecurityConfig, PartialSecurityConfig
// - : PRODUCTION_CSP_POLICY, DEFAULT_IPC_WHITELIST, DEFAULT_RATE_LIMITS, DEFAULT_SECURITY_POLICY
