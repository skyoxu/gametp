import type { FuseVersion } from '@electron/fuses';

export type FuseBooleanKey =
  | 'runAsNode'
  | 'enableRunAsNode'
  | 'enableNodeOptionsEnvironmentVariable'
  | 'enableNodeCliInspectArguments'
  | 'onlyLoadAppFromAsar'
  | 'enableEmbeddedAsarIntegrityValidation'
  | 'resetAdHocDarwinCASignature'
  | 'enableCookieEncryption'
  | 'loadBrowserProcessSpecificV8Snapshot'
  | 'enablePrintPrototypeOverwrite';

export interface FusesConfig {
  version: FuseVersion;
  runAsNode: boolean;
  enableRunAsNode: boolean;
  enableNodeOptionsEnvironmentVariable: boolean;
  enableNodeCliInspectArguments: boolean;
  onlyLoadAppFromAsar: boolean;
  enableEmbeddedAsarIntegrityValidation: boolean;
  resetAdHocDarwinCASignature: boolean;
  enableCookieEncryption: boolean;
  loadBrowserProcessSpecificV8Snapshot: boolean;
  enablePrintPrototypeOverwrite: boolean;
}

export interface FuseMismatch {
  key: FuseBooleanKey;
  actual: boolean | undefined;
  expected: boolean;
}

export interface FuseEvaluationResult {
  ok: boolean;
  mismatches: FuseMismatch[];
}

export function applyFusesConfig(isProduction?: boolean): Promise<void>;
export function verifyFusesConfig(
  electronBinary: string,
  expectedConfig: FusesConfig
): Promise<FuseEvaluationResult>;
export function verifyFusesConfigWith(
  electronBinary: string,
  expectedConfig: FusesConfig,
  deps?: {
    readFusesFn?: (
      binary: string
    ) => Promise<Partial<Record<FuseBooleanKey, boolean>>>;
    exitFn?: (code: number) => never;
  }
): Promise<FuseEvaluationResult>;
export function evaluateFuses(
  actual: Partial<Record<FuseBooleanKey, boolean>> | undefined,
  expectedConfig: FusesConfig
): FuseEvaluationResult;

export const PRODUCTION_FUSES_CONFIG: FusesConfig;
export const DEVELOPMENT_FUSES_CONFIG: FusesConfig;
