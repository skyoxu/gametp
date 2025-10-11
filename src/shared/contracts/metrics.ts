/**
 * Metrics contracts (ASCII-only, test-friendly)
 */

export enum MetricUnit {
  Milliseconds = 'Milliseconds',
  Seconds = 'Seconds',
  Microseconds = 'Microseconds',
  Count = 'Count',
  CountPerSecond = 'Count/Second',
  Percent = 'Percent',
  Bytes = 'Bytes',
  Kilobytes = 'Kilobytes',
  Megabytes = 'Megabytes',
  Gigabytes = 'Gigabytes',
  BytesPerSecond = 'Bytes/Second',
  KilobytesPerSecond = 'Kilobytes/Second',
  MegabytesPerSecond = 'Megabytes/Second',
  None = 'None',
}

export enum NFRCategory {
  RELIABILITY = 'reliability',
  PERFORMANCE = 'performance',
  AVAILABILITY = 'availability',
  SECURITY = 'security',
  USABILITY = 'usability',
}

export function createNFRKey(category: NFRCategory, name: string): string {
  return `NFR-${category.toUpperCase()}-${name.toUpperCase()}`;
}

export const NFR_KEYS = {
  RELIABILITY: {
    CRASH_FREE_USERS: createNFRKey(NFRCategory.RELIABILITY, 'crash_free_users'),
    CRASH_FREE_SESSIONS: createNFRKey(NFRCategory.RELIABILITY, 'crash_free_sessions'),
    SERVICE_AVAILABILITY: createNFRKey(NFRCategory.RELIABILITY, 'service_availability'),
    DATA_CONSISTENCY: createNFRKey(NFRCategory.RELIABILITY, 'data_consistency'),
  },
  PERFORMANCE: {
    RESPONSE_TIME: createNFRKey(NFRCategory.PERFORMANCE, 'response_time'),
    THROUGHPUT: createNFRKey(NFRCategory.PERFORMANCE, 'throughput'),
    MEMORY_USAGE: createNFRKey(NFRCategory.PERFORMANCE, 'memory_usage'),
    CPU_USAGE: createNFRKey(NFRCategory.PERFORMANCE, 'cpu_usage'),
    STARTUP_TIME: createNFRKey(NFRCategory.PERFORMANCE, 'startup_time'),
  },
  AVAILABILITY: {
    UPTIME: createNFRKey(NFRCategory.AVAILABILITY, 'uptime'),
  },
  SECURITY: {
    AUTH_SUCCESS_RATE: createNFRKey(NFRCategory.SECURITY, 'auth_success_rate'),
  },
} as const;

export type NFRKey = (typeof NFR_KEYS)[keyof typeof NFR_KEYS][keyof (typeof NFR_KEYS)[keyof typeof NFR_KEYS]];

export interface ServiceLevelIndicator {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly unit: MetricUnit;
  readonly nfrKey: NFRKey;
  readonly query: string;
  readonly dimensions?: readonly string[];
  readonly metricType: 'gauge' | 'counter' | 'histogram';
}

export interface ServiceLevelObjective {
  readonly id: string;
  readonly sliId: string;
  readonly targets: {
    readonly production: string;
    readonly staging: string;
    readonly development: string;
  };
  readonly observationWindow: string;
  readonly alertThreshold: string;
  readonly errorBudget?: string;
}

export const CORE_SLIS = {
  CRASH_FREE_USERS: {
    id: 'crash_free_users',
    name: 'Crash-Free Users',
    // Note
    description: '\u5728\u89c2\u5bdf\u7a97\u53e3\u5185\u672a\u9047\u5230\u5d29\u6e83\u7684\u7528\u6237\u767e\u5206\u6bd4',
    unit: MetricUnit.Percent,
    nfrKey: NFR_KEYS.RELIABILITY.CRASH_FREE_USERS,
    query: 'sentry.release_health.crash_free_users',
    dimensions: ['environment', 'release', 'platform'],
    metricType: 'gauge',
  },
  CRASH_FREE_SESSIONS: {
    id: 'crash_free_sessions',
    name: 'Crash-Free Sessions',
    // Note
    description: '\u5728\u89c2\u5bdf\u7a97\u53e3\u5185\u672a\u5d29\u6e83\u7684\u4f1a\u8bdd\u767e\u5206\u6bd4',
    unit: MetricUnit.Percent,
    nfrKey: NFR_KEYS.RELIABILITY.CRASH_FREE_SESSIONS,
    query: 'sentry.release_health.crash_free_sessions',
    dimensions: ['environment', 'release', 'platform'],
    metricType: 'gauge',
  },
  RESPONSE_TIME_P95: {
    id: 'response_time_p95',
    name: 'Response Time P95',
    description: '95th percentile response time',
    unit: MetricUnit.Milliseconds,
    nfrKey: NFR_KEYS.PERFORMANCE.RESPONSE_TIME,
    query: 'custom.performance.response_time.p95',
    dimensions: ['service', 'endpoint', 'environment'],
    metricType: 'histogram',
  },
} as const;

export const CORE_SLOS = {
  CRASH_FREE_USERS: {
    id: 'crash_free_users_slo',
    sliId: 'crash_free_users',
    targets: {
      production: '\u226599.5%',
      staging: '\u226599.0%',
      development: '\u226595.0%',
    },
    observationWindow: '24h',
    alertThreshold: '\u226499.0%',
  },
  CRASH_FREE_SESSIONS: {
    id: 'crash_free_sessions_slo',
    sliId: 'crash_free_sessions',
    targets: {
      production: '\u226599.8%',
      staging: '\u226599.5%',
      development: '\u226597.0%',
    },
    observationWindow: '24h',
    alertThreshold: '\u226499.5%',
  },
  RESPONSE_TIME_P95: {
    id: 'response_time_p95_slo',
    sliId: 'response_time_p95',
    targets: {
      production: '\u22641000ms',
      staging: '\u22641000ms',
      development: '\u22641000ms',
    },
    observationWindow: '1h',
    alertThreshold: '\u22641500ms',
  },
} as const;

export interface ReleaseHealthResult {
  readonly passed: boolean;
  readonly metrics: {
    readonly crashFreeUsers: number;
    readonly crashFreeSessions: number;
    readonly sampleSize: number;
    readonly observationWindow: string;
  };
  readonly violations: ReadonlyArray<{
    readonly metric: string;
    readonly actual: number;
    readonly threshold: number;
    readonly severity: 'warning' | 'blocking';
  }>;
  readonly timestamp: string;
  readonly environment: string;
}

export interface ReleaseHealthGateConfig {
  readonly sentryOrg: string;
  readonly sentryProject: string;
  readonly authToken: string;
  readonly environment?: {
    readonly CRASH_FREE_USERS_THRESHOLD?: string;
    readonly CRASH_FREE_SESSIONS_THRESHOLD?: string;
    readonly OBSERVATION_WINDOW_HOURS?: string;
  };
}

export class ReleaseHealthGate {
  constructor(private readonly config: ReleaseHealthGateConfig) {}

  async checkReleaseHealth(): Promise<ReleaseHealthResult> {
    try {
      const fallbackNumber = (v: unknown, def: number) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : def;
      };

      const crashFreeUsersThreshold = fallbackNumber(
        this.config.environment?.CRASH_FREE_USERS_THRESHOLD ??
          process.env.CRASH_FREE_USERS_THRESHOLD ??
          '99.5',
        99.5
      );

      const crashFreeSessionsThreshold = fallbackNumber(
        this.config.environment?.CRASH_FREE_SESSIONS_THRESHOLD ??
          process.env.CRASH_FREE_SESSIONS_THRESHOLD ??
          '99.8',
        99.8
      );

      const observationWindowHours = fallbackNumber(
        this.config.environment?.OBSERVATION_WINDOW_HOURS ??
          process.env.OBSERVATION_WINDOW_HOURS ??
          '24',
        24
      );

      const metrics = await this.fetchReleaseHealthMetrics(observationWindowHours);

      type Violation = ReleaseHealthResult['violations'][number];
      const violationsArr: Violation[] = [];
      if (metrics.crashFreeUsers < crashFreeUsersThreshold) {
        violationsArr.push({
          metric: 'crash_free_users',
          actual: metrics.crashFreeUsers,
          threshold: crashFreeUsersThreshold,
          severity: 'blocking',
        });
      }
      if (metrics.crashFreeSessions < crashFreeSessionsThreshold) {
        violationsArr.push({
          metric: 'crash_free_sessions',
          actual: metrics.crashFreeSessions,
          threshold: crashFreeSessionsThreshold,
          severity: 'blocking',
        });
      }

      return {
        passed: violationsArr.length === 0,
        metrics,
        violations: violationsArr,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV ?? 'unknown',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? 'unknown');
      throw new Error(`Release Health Gate 检查失败: ${message}`);
    }
  }

  async generateReport(): Promise<string> {
    const result = await this.checkReleaseHealth();
    const lines = [
      '# Release Health Gate Report',
      '',
      `**Status**: ${result.passed ? '\u2705 PASSED' : '\u274C FAILED'}`,
      `**Timestamp**: ${result.timestamp}`,
      `**Environment**: ${result.environment}`,
      '',
      '## Metrics',
      `- **Crash-Free Users**: ${result.metrics.crashFreeUsers.toFixed(2)}%`,
      `- **Crash-Free Sessions**: ${result.metrics.crashFreeSessions.toFixed(2)}%`,
      `- **Sample Size**: ${result.metrics.sampleSize}`,
      `- **Window**: ${result.metrics.observationWindow}`,
    ];
    if (result.violations.length > 0) {
      lines.push('', '## Violations');
      result.violations.forEach(v =>
        lines.push(`- **${v.metric}**: ${v.actual} < ${v.threshold} (${v.severity})`)
      );
    }
    return lines.join('\n');
  }

  protected async fetchReleaseHealthMetrics(
    observationWindowHours: number
  ): Promise<ReleaseHealthResult['metrics']> {
    return {
      crashFreeUsers: 99.7,
      crashFreeSessions: 99.9,
      sampleSize: 10000,
      observationWindow: `${observationWindowHours}h`,
    };
  }
}

export const DEFAULT_SAMPLING_CONFIG = {
  production: { errors: 1.0, transactions: 0.1, replays: 0.01 },
  staging: { errors: 1.0, transactions: 0.1, replays: 0.01 },
  development: { errors: 1.0, transactions: 0.2, replays: 0.02 },
} as const;

export const DEFAULT_OBSERVATION_WINDOWS = {
  realtime: '5m',
  shortTerm: '1h',
  mediumTerm: '24h',
  longTerm: '7d',
  release: '7d',
} as const;

export const TRACEABILITY_MATRIX = {
  nfrToSlo: {
    [NFR_KEYS.RELIABILITY.CRASH_FREE_USERS]: {
      slo: 'crash_free_users',
      adr: ['ADR-0003'],
      testRefs: ['tests/e2e/reliability.spec.ts'],
      monitoringQuery: 'sentry.release_health.crash_free_users',
    },
    [NFR_KEYS.PERFORMANCE.RESPONSE_TIME]: {
      slo: 'response_time_p95',
      adr: ['ADR-0005'],
      testRefs: ['tests/e2e/perf.spec.ts'],
      monitoringQuery: 'custom.performance.response_time.p95',
    },
  },
  adrToImplementation: {
    'ADR-0003': {
      title: '可观测性与发布健康 (Release Health)',
      implementations: [
        'src/shared/observability/sentry-main.ts',
        'src/shared/observability/logger.ts',
      ],
      tests: ['tests/unit/observability.spec.ts', 'tests/e2e/monitoring.spec.ts'],
    },
  },
} as const;

export const GAME_MONITORING_SLIS = {
  PHASER_SCENE_TRANSITION: {
    id: 'phaser_scene_transition_time',
    target: 'P95 \u2264 200ms',
    unit: 'milliseconds',
    query: 'phaser.scene_transition',
    nfrKey: NFR_KEYS.PERFORMANCE.RESPONSE_TIME,
  },
  REACT_PHASER_SYNC: {
    id: 'react_phaser_sync_latency',
    target: 'P95 \u2264 50ms',
    unit: 'milliseconds',
    query: 'react_phaser_sync',
    nfrKey: NFR_KEYS.PERFORMANCE.RESPONSE_TIME,
  },
  BATTLE_COMPUTATION_TIME: {
    id: 'battle_computation_time',
    target: 'P95 \u2264 50ms',
    unit: 'milliseconds',
    query: 'battle.computation',
    nfrKey: NFR_KEYS.PERFORMANCE.RESPONSE_TIME,
  },
  AI_DECISION_TIME: {
    id: 'ai_decision_time',
    target: 'P95 \u2264 200ms',
    unit: 'milliseconds',
    query: 'ai.decision',
    nfrKey: NFR_KEYS.PERFORMANCE.RESPONSE_TIME,
  },
  SAVE_GAME_TIME: {
    id: 'save_game_time',
    target: 'P95 \u2264 1000ms',
    unit: 'milliseconds',
    query: 'save.game',
    nfrKey: NFR_KEYS.PERFORMANCE.RESPONSE_TIME,
  },
} as const;

export const TIER_0_THRESHOLDS = {
  crashFreeUsers: { production: 99.5, staging: 99.0, development: 95.0 },
  crashFreeSessions: { production: 99.8, staging: 99.5, development: 97.0 },
  criticalErrors: { production: 0, staging: 1, development: 5 },
  performanceRegression: {
    frameTimeP95: 16.7,
    interactionP95: 100,
    startupTimeP95: 3000,
  },
} as const;

export type SamplingConfig = {
  errorSampling: number;
  transactionSampling: number;
  replaySampling: number;
  costBudgetMonthly: number;
};

export const SAMPLING_STRATEGIES: Record<string, SamplingConfig> = {
  production: {
    errorSampling: 1.0,
    transactionSampling: 0.1,
    replaySampling: 0.01,
    costBudgetMonthly: 800,
  },
  staging: {
    errorSampling: 1.0,
    transactionSampling: 0.1,
    replaySampling: 0.01,
    costBudgetMonthly: 400,
  },
  development: {
    errorSampling: 1.0,
    transactionSampling: 0.2,
    replaySampling: 0.02,
    costBudgetMonthly: 200,
  },
};
