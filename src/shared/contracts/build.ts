/**
 * 鏋勫缓涓庤川閲忛棬绂佺浉鍏崇殑绫诲瀷瀹氫箟
 * 瀵瑰簲 07 绔犳灦鏋勬枃妗ｇ殑濂戠害鎺ュ彛
 *
 * @version 1.0.1 - 娣诲姞鎬ц兘妫€鏌ュ伐浣滄祦娴嬭瘯娉ㄩ噴
 */

export interface QualityGateConfig {
  coverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  electron: {
    nodeIntegration: false;
    contextIsolation: true;
    sandbox: true;
    webSecurity: true;
  };
  timeouts: {
    build: number; // 鏋勫缓瓒呮椂锛堟绉掞級
    test: number; // 娴嬭瘯瓒呮椂锛堟绉掞級
    e2e: number; // E2E 娴嬭瘯瓒呮椂锛堟绉掞級
  };
}

export interface SentryGateConfig {
  releaseHealth: {
    minCrashFreeUsers: number; // 鏈€灏忓穿婧冭嚜鐢辩敤鎴风巼 (%)
    minCrashFreeSessions: number; // 鏈€灏忓穿婧冭嚜鐢变細璇濈巼 (%)
    minAdoptionRate: number; // 鏈€灏忛噰鐢ㄧ巼 (%)
    windowHours: number; // 缁熻绐楀彛锛堝皬鏃讹級
  };
  performance: {
    maxP95: number; // 鏈€澶?P95 鍝嶅簲鏃堕棿锛堟绉掞級
    maxErrorRate: number; // 鏈€澶ч敊璇巼 (%)
  };
}

export interface ElectronSecurityEnforce {
  browserWindow: {
    nodeIntegration: false;
    contextIsolation: true;
    sandbox: true;
    webSecurity: true;
    allowRunningInsecureContent: false;
    experimentalFeatures: false;
  };
  csp: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    objectSrc: string[];
    frameSrc: string[];
  };
  preload: {
    whitelistOnly: true;
    noNodeAccess: true;
    contextBridgeRequired: true;
  };
}

/**
 * 璐ㄩ噺闂ㄧ鎵ц缁撴灉
 */
export interface GateResult {
  name: string;
  passed: boolean;
  score?: number;
  violations: string[];
  warnings: string[];
  executionTime: number;
}

/**
 * 鏋勫缓绠￠亾鐘舵€? */
export type BuildStage =
  | 'typecheck'
  | 'lint'
  | 'test:unit'
  | 'test:e2e'
  | 'guard:electron'
  | 'guard:quality'
  | 'guard:base'
  | 'guard:health';

export interface BuildPipelineResult {
  stages: Record<BuildStage, GateResult>;
  overallResult: 'passed' | 'failed' | 'warning';
  totalExecutionTime: number;
  timestamp: number;
}

/**
 * Release Health 鏁版嵁缁撴瀯
 */
export interface ReleaseHealthData {
  windowHours: number;
  release: string;
  sessions: {
    crashFreeRate: number;
    adoption: number;
    total: number;
  };
  users: {
    crashFreeRate: number;
    total: number;
  };
  thresholds: {
    sessions: number;
    users: number;
    minAdoption: number;
  };
}

/**
 * 榛樿閰嶇疆甯搁噺
 */
export const DEFAULT_QUALITY_CONFIG: QualityGateConfig = {
  coverage: {
    lines: 90,
    branches: 85,
    functions: 90,
    statements: 90,
  },
  electron: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
  },
  timeouts: {
    build: 300000, // 5鍒嗛挓
    test: 120000, // 2鍒嗛挓
    e2e: 600000, // 10鍒嗛挓
  },
};

export const DEFAULT_SENTRY_CONFIG: SentryGateConfig = {
  releaseHealth: {
    minCrashFreeUsers: 99.5,
    minCrashFreeSessions: 99.0,
    minAdoptionRate: 20.0,
    windowHours: 24,
  },
  performance: {
    maxP95: 100,
    maxErrorRate: 1.0,
  },
};

export const ELECTRON_SECURITY_BASELINE: ElectronSecurityEnforce = {
  browserWindow: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
  },
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
  },
  preload: {
    whitelistOnly: true,
    noNodeAccess: true,
    contextBridgeRequired: true,
  },
};

/**
 * 鐜鍙橀噺閰嶇疆鏄犲皠
 */
export interface QualityGateEnvConfig {
  COVERAGE_LINES_MIN?: string;
  COVERAGE_BRANCHES_MIN?: string;
  COVERAGE_FUNCTIONS_MIN?: string;
  COVERAGE_STATEMENTS_MIN?: string;
  CRASH_FREE_USERS_GA?: string;
  CRASH_FREE_SESSIONS_GA?: string;
  MIN_ADOPTION_RATE?: string;
  HEALTH_WINDOW_HOURS?: string;
  BUILD_TIMEOUT?: string;
  TEST_TIMEOUT?: string;
  E2E_TIMEOUT?: string;
}

/**
 * 浠庣幆澧冨彉閲忔瀯寤洪厤缃? */
export function buildConfigFromEnv(
  _env: QualityGateEnvConfig = process.env as QualityGateEnvConfig
): QualityGateConfig {
  return {
    coverage: {
      lines: Number(
        _env.COVERAGE_LINES_MIN ?? DEFAULT_QUALITY_CONFIG.coverage.lines
      ),
      branches: Number(
        _env.COVERAGE_BRANCHES_MIN ?? DEFAULT_QUALITY_CONFIG.coverage.branches
      ),
      functions: Number(
        _env.COVERAGE_FUNCTIONS_MIN ?? DEFAULT_QUALITY_CONFIG.coverage.functions
      ),
      statements: Number(
        _env.COVERAGE_STATEMENTS_MIN ??
          DEFAULT_QUALITY_CONFIG.coverage.statements
      ),
    },
    electron: DEFAULT_QUALITY_CONFIG.electron,
    timeouts: {
      build: Number(
        _env.BUILD_TIMEOUT ?? DEFAULT_QUALITY_CONFIG.timeouts.build
      ),
      test: Number(_env.TEST_TIMEOUT ?? DEFAULT_QUALITY_CONFIG.timeouts.test),
      e2e: Number(_env.E2E_TIMEOUT ?? DEFAULT_QUALITY_CONFIG.timeouts.e2e),
    },
  };
}

export function sentryConfigFromEnv(
  _env: QualityGateEnvConfig = process.env as QualityGateEnvConfig
): SentryGateConfig {
  return {
    releaseHealth: {
      minCrashFreeUsers: Number(
        _env.CRASH_FREE_USERS_GA ??
          DEFAULT_SENTRY_CONFIG.releaseHealth.minCrashFreeUsers
      ),
      minCrashFreeSessions: Number(
        _env.CRASH_FREE_SESSIONS_GA ??
          DEFAULT_SENTRY_CONFIG.releaseHealth.minCrashFreeSessions
      ),
      minAdoptionRate: Number(
        _env.MIN_ADOPTION_RATE ??
          DEFAULT_SENTRY_CONFIG.releaseHealth.minAdoptionRate
      ),
      windowHours: Number(
        _env.HEALTH_WINDOW_HOURS ??
          DEFAULT_SENTRY_CONFIG.releaseHealth.windowHours
      ),
    },
    performance: DEFAULT_SENTRY_CONFIG.performance,
  };
}
