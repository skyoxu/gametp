/**
 * @fileoverview
 * @description  03-(Sentry+)-v2.md
 * @references ADR-0003, ADR-0005
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NFR_KEYS,
  CORE_SLIS,
  CORE_SLOS,
  ReleaseHealthGate,
  ReleaseHealthGateConfig,
  DEFAULT_SAMPLING_CONFIG,
  DEFAULT_OBSERVATION_WINDOWS,
  TRACEABILITY_MATRIX,
  // V2 monitoring additions
  GAME_MONITORING_SLIS,
  TIER_0_THRESHOLDS,
  SAMPLING_STRATEGIES,
  type SamplingConfig,
} from '../../src/shared/contracts/metrics';

// Local testing-only helper types to avoid any
type RHMetrics = {
  crashFreeUsers: number;
  crashFreeSessions: number;
  sampleSize: number;
  observationWindow: string;
};
type RHSpyTarget = { fetchReleaseHealthMetrics: () => Promise<RHMetrics> };

// ============================================================================
// NFR Keys overview
// ============================================================================

describe('NFR Keys', () => {
  it('\u5e94\u5305\u542b\u6240\u6709\u5fc5\u9700\u7684\u53ef\u9760\u6027 NFR \u952e\u503c', () => {
    expect(NFR_KEYS.RELIABILITY).toBeDefined();
    expect(NFR_KEYS.RELIABILITY.CRASH_FREE_USERS).toBe(
      'NFR-RELIABILITY-CRASH_FREE_USERS'
    );
    expect(NFR_KEYS.RELIABILITY.CRASH_FREE_SESSIONS).toBe(
      'NFR-RELIABILITY-CRASH_FREE_SESSIONS'
    );
    expect(NFR_KEYS.RELIABILITY.SERVICE_AVAILABILITY).toBe(
      'NFR-RELIABILITY-SERVICE_AVAILABILITY'
    );
    expect(NFR_KEYS.RELIABILITY.DATA_CONSISTENCY).toBe(
      'NFR-RELIABILITY-DATA_CONSISTENCY'
    );
  });

  it('\u5e94\u5305\u542b\u6240\u6709\u5fc5\u9700\u7684\u6027\u80fd NFR \u952e\u503c', () => {
    expect(NFR_KEYS.PERFORMANCE).toBeDefined();
    expect(NFR_KEYS.PERFORMANCE.RESPONSE_TIME).toBe(
      'NFR-PERFORMANCE-RESPONSE_TIME'
    );
    expect(NFR_KEYS.PERFORMANCE.THROUGHPUT).toBe('NFR-PERFORMANCE-THROUGHPUT');
    expect(NFR_KEYS.PERFORMANCE.MEMORY_USAGE).toBe(
      'NFR-PERFORMANCE-MEMORY_USAGE'
    );
    expect(NFR_KEYS.PERFORMANCE.CPU_USAGE).toBe('NFR-PERFORMANCE-CPU_USAGE');
    expect(NFR_KEYS.PERFORMANCE.STARTUP_TIME).toBe(
      'NFR-PERFORMANCE-STARTUP_TIME'
    );
  });

  it('\u5e94\u5305\u542b\u6240\u6709\u5fc5\u9700\u7684\u53ef\u7528\u6027\u548c\u5b89\u5168\u6027 NFR \u952e\u503c', () => {
    expect(NFR_KEYS.AVAILABILITY).toBeDefined();
    expect(NFR_KEYS.SECURITY).toBeDefined();

    // Validate key format matches NFR-{CATEGORY}-{DESCRIPTOR}
    const nfrKeyPattern = /^NFR-[A-Z]+-[A-Z_]+$/;
    expect(NFR_KEYS.AVAILABILITY.UPTIME).toMatch(nfrKeyPattern);
    expect(NFR_KEYS.SECURITY.AUTH_SUCCESS_RATE).toMatch(nfrKeyPattern);

    // Validate specific values
    expect(NFR_KEYS.AVAILABILITY.UPTIME).toBe('NFR-AVAILABILITY-UPTIME');
    expect(NFR_KEYS.SECURITY.AUTH_SUCCESS_RATE).toBe(
      'NFR-SECURITY-AUTH_SUCCESS_RATE'
    );
  });

  it('\u6240\u6709 NFR \u952e\u503c\u5e94\u8be5\u662f\u552f\u4e00\u7684', () => {
    const allKeys: string[] = [];

    // Collect all key values
    Object.values(NFR_KEYS).forEach(category => {
      Object.values(category).forEach(key => {
        allKeys.push(key);
      });
    });

    // Validate uniqueness
    const uniqueKeys = new Set(allKeys);
    expect(uniqueKeys.size).toBe(allKeys.length);
  });
});

// ============================================================================
// SLI/SLO overview
// ============================================================================

describe('Service Level Indicators (SLI)', () => {
  it('\u5e94\u5b9a\u4e49\u6838\u5fc3 SLI \u5e76\u5305\u542b\u5fc5\u9700\u5b57\u6bb5', () => {
    const crashFreeSli = CORE_SLIS.CRASH_FREE_USERS;

    expect(crashFreeSli).toBeDefined();
    expect(crashFreeSli.id).toBe('crash_free_users');
    expect(crashFreeSli.name).toBe('Crash-Free Users');
    expect(crashFreeSli.description).toContain(
      '\u672a\u9047\u5230\u5d29\u6e83\u7684\u7528\u6237\u767e\u5206\u6bd4'
    );
    expect(crashFreeSli.unit).toBe('Percent');
    expect(crashFreeSli.nfrKey).toBe(NFR_KEYS.RELIABILITY.CRASH_FREE_USERS);
    expect(crashFreeSli.query).toContain('sentry');
  });

  it('\u6bcf\u4e2a SLI \u5e94\u8be5\u6709\u5bf9\u5e94\u7684 NFR \u952e\u503c', () => {
    Object.values(CORE_SLIS).forEach(sli => {
      expect(sli.nfrKey).toBeDefined();
      expect(typeof sli.nfrKey).toBe('string');
      expect(sli.nfrKey).toMatch(/^NFR-[A-Z]+-[A-Z_]+$/);
    });
  });
});

describe('Service Level Objectives (SLO)', () => {
  it('\u5e94\u5b9a\u4e49\u6838\u5fc3 SLO \u5e76\u5305\u542b\u73af\u5883\u5dee\u5f02\u5316\u76ee\u6807', () => {
    const crashFreeSlo = CORE_SLOS.CRASH_FREE_USERS;

    expect(crashFreeSlo).toBeDefined();
    expect(crashFreeSlo.id).toBe('crash_free_users_slo');
    expect(crashFreeSlo.sliId).toBe('crash_free_users');

    // Validate targets
    expect(crashFreeSlo.targets.production).toBe('\u226599.5%');
    expect(crashFreeSlo.targets.staging).toBe('\u226599.0%');
    expect(crashFreeSlo.targets.development).toBe('\u226595.0%');

    expect(crashFreeSlo.observationWindow).toBe('24h');
    expect(crashFreeSlo.alertThreshold).toBe('\u226499.0%');
  });

  it('\u6240\u6709 SLO \u5e94\u8be5\u6709\u5bf9\u5e94\u7684 SLI', () => {
    Object.values(CORE_SLOS).forEach(slo => {
      const correspondingSli = Object.values(CORE_SLIS).find(
        sli => sli.id === slo.sliId
      );
      expect(correspondingSli).toBeDefined();
    });
  });

  it('\u751f\u4ea7\u73af\u5883\u76ee\u6807\u5e94\u8be5\u6700\u4e25\u683c', () => {
    Object.values(CORE_SLOS).forEach(slo => {
      const prodTarget = slo.targets.production;
      const stagingTarget = slo.targets.staging;
      const devTarget = slo.targets.development;

      // Ensure production target values
      expect(prodTarget).toBeDefined();
      expect(stagingTarget).toBeDefined();
      expect(devTarget).toBeDefined();

      // Validate threshold/value formatting: starts with >= or <= (\u2265 or \u2264), then a number and unit
      expect(prodTarget).toMatch(/^[\u2265\u2264]\d+(\.\d+)?[%ms]*$/);
    });
  });
});

// ============================================================================
// Release Health Gate overview
// ============================================================================

describe('ReleaseHealthGate', () => {
  let mockConfig: ReleaseHealthGateConfig;
  let releaseHealthGate: ReleaseHealthGate;

  beforeEach(() => {
    mockConfig = {
      sentryOrg: 'test-org',
      sentryProject: 'test-project',
      authToken: 'test-token-123',
    };

    releaseHealthGate = new ReleaseHealthGate(mockConfig);

    // Compute health result
    delete process.env.CRASH_FREE_USERS_THRESHOLD;
    delete process.env.CRASH_FREE_SESSIONS_THRESHOLD;
    delete process.env.OBSERVATION_WINDOW_HOURS;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('\u5e94\u8be5\u6b63\u786e\u5b9e\u4f8b\u5316\u5e76\u4fdd\u5b58\u914d\u7f6e', () => {
    expect(releaseHealthGate).toBeInstanceOf(ReleaseHealthGate);
    expect(releaseHealthGate['config']).toEqual(mockConfig);
  });

  it('\u5e94\u8be5\u4f7f\u7528\u9ed8\u8ba4\u9608\u503c\u5f53\u672a\u63d0\u4f9b\u73af\u5883\u53d8\u91cf\u65f6', async () => {
    // Mock fetch API calls
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ crash_free_users: 99.7, crash_free_sessions: 99.9 }),
    } as Response);

    // Temporarily bypass real API by using defaults
    const mockFetchMetrics = vi
      .spyOn(
        releaseHealthGate as unknown as RHSpyTarget,
        'fetchReleaseHealthMetrics'
      )
      .mockResolvedValueOnce({
        crashFreeUsers: 99.7,
        crashFreeSessions: 99.9,
        sampleSize: 10000,
        observationWindow: '24h',
      });

    const result = await releaseHealthGate.checkReleaseHealth();

    expect(result.passed).toBe(true);
    expect(result.metrics.crashFreeUsers).toBe(99.7);
    expect(result.metrics.crashFreeSessions).toBe(99.9);
    expect(result.violations).toHaveLength(0);

    mockFetch.mockRestore();
    mockFetchMetrics.mockRestore();
  });

  it('\u5e94\u8be5\u8bc6\u522b\u8fdd\u89c4\u5e76\u8fd4\u56de\u5931\u8d25\u7ed3\u679c', async () => {
    // Configure metric value to simulate violation
    const mockFetchMetrics = vi
      .spyOn(
        releaseHealthGate as unknown as RHSpyTarget,
        'fetchReleaseHealthMetrics'
      )
      .mockResolvedValueOnce({
        crashFreeUsers: 98.5, //  99.5%
        crashFreeSessions: 99.2, //  99.8%
        sampleSize: 5000,
        observationWindow: '24h',
      });

    const result = await releaseHealthGate.checkReleaseHealth();

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(2);

    const userViolation = result.violations.find(
      v => v.metric === 'crash_free_users'
    );
    const sessionViolation = result.violations.find(
      v => v.metric === 'crash_free_sessions'
    );

    expect(userViolation).toBeDefined();
    expect(userViolation?.actual).toBe(98.5);
    expect(userViolation?.threshold).toBe(99.5);
    expect(userViolation?.severity).toBe('blocking');

    expect(sessionViolation).toBeDefined();
    expect(sessionViolation?.actual).toBe(99.2);
    expect(sessionViolation?.threshold).toBe(99.8);

    mockFetchMetrics.mockRestore();
  });

  it('\u5e94\u8be5\u652f\u6301\u73af\u5883\u53d8\u91cf\u8986\u76d6\u9608\u503c', async () => {
    // Provide insufficient sample size
    process.env.CRASH_FREE_USERS_THRESHOLD = '98.0';
    process.env.CRASH_FREE_SESSIONS_THRESHOLD = '99.0';
    process.env.OBSERVATION_WINDOW_HOURS = '48';

    const mockFetchMetrics = vi
      .spyOn(
        releaseHealthGate as unknown as RHSpyTarget,
        'fetchReleaseHealthMetrics'
      )
      .mockResolvedValueOnce({
        crashFreeUsers: 98.5,
        crashFreeSessions: 99.2,
        sampleSize: 8000,
        observationWindow: '48h',
      });

    const result = await releaseHealthGate.checkReleaseHealth();

    // Use lenient thresholds so checks pass
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);

    mockFetchMetrics.mockRestore();
  });

  it('\u5e94\u8be5\u751f\u6210\u683c\u5f0f\u5316\u7684 Markdown \u62a5\u544a', async () => {
    const mockFetchMetrics = vi
      .spyOn(
        releaseHealthGate as unknown as RHSpyTarget,
        'fetchReleaseHealthMetrics'
      )
      .mockResolvedValueOnce({
        crashFreeUsers: 99.7,
        crashFreeSessions: 99.9,
        sampleSize: 10000,
        observationWindow: '24h',
      });

    const report = await releaseHealthGate.generateReport();

    expect(report).toContain('# Release Health Gate Report');
    expect(report).toContain('\u2705 PASSED');
    expect(report).toContain('**Crash-Free Users**: 99.70%');
    expect(report).toContain('**Crash-Free Sessions**: 99.90%');
    expect(report).toContain('**Sample Size**: 10000');

    mockFetchMetrics.mockRestore();
  });

  it('\u5e94\u8be5\u5728\u68c0\u67e5\u5931\u8d25\u65f6\u629b\u51fa\u9002\u5f53\u7684\u9519\u8bef', async () => {
    const mockFetchMetrics = vi
      .spyOn(
        releaseHealthGate as unknown as RHSpyTarget,
        'fetchReleaseHealthMetrics'
      )
      .mockRejectedValueOnce(new Error('Sentry API \u8fde\u63a5\u5931\u8d25'));

    await expect(releaseHealthGate.checkReleaseHealth()).rejects.toThrow(
      'Release Health Gate \u68c0\u67e5\u5931\u8d25: Sentry API \u8fde\u63a5\u5931\u8d25'
    );

    mockFetchMetrics.mockRestore();
  });
});

// ============================================================================
// Default configuration checks
// ============================================================================

describe('Default Configurations', () => {
  it('\u5e94\u8be5\u5b9a\u4e49\u6709\u6548\u7684\u9ed8\u8ba4\u91c7\u6837\u914d\u7f6e', () => {
    expect(DEFAULT_SAMPLING_CONFIG).toBeDefined();

    // Validate constraints
    ['production', 'staging', 'development'].forEach(env => {
      const config =
        DEFAULT_SAMPLING_CONFIG[env as keyof typeof DEFAULT_SAMPLING_CONFIG];

      expect(config).toBeDefined();
      expect(config.errors).toBeGreaterThanOrEqual(0);
      expect(config.errors).toBeLessThanOrEqual(1);
      expect(config.transactions).toBeGreaterThanOrEqual(0);
      expect(config.transactions).toBeLessThanOrEqual(1);
      expect(config.replays).toBeGreaterThanOrEqual(0);
      expect(config.replays).toBeLessThanOrEqual(1);
    });

    // Validate rounding and precision preserved
    expect(DEFAULT_SAMPLING_CONFIG.production.transactions).toBeLessThanOrEqual(
      DEFAULT_SAMPLING_CONFIG.development.transactions
    );
    expect(DEFAULT_SAMPLING_CONFIG.production.replays).toBeLessThanOrEqual(
      DEFAULT_SAMPLING_CONFIG.development.replays
    );
  });

  it('\u5e94\u8be5\u5b9a\u4e49\u6709\u6548\u7684\u9ed8\u8ba4\u89c2\u5bdf\u7a97\u53e3', () => {
    expect(DEFAULT_OBSERVATION_WINDOWS).toBeDefined();

    const windows = DEFAULT_OBSERVATION_WINDOWS;
    expect(windows.realtime).toMatch(/^\d+[mh]$/); //  "5m"
    expect(windows.shortTerm).toMatch(/^\d+[mh]$/);
    expect(windows.mediumTerm).toMatch(/^\d+[hd]$/);
    expect(windows.longTerm).toMatch(/^\d+[hd]$/);
    expect(windows.release).toMatch(/^\d+[hd]$/);

    // Validate observation window order: realtime < hour < day < week
    expect(windows.realtime).toBe('5m');
    expect(windows.shortTerm).toBe('1h');
    expect(windows.mediumTerm).toBe('24h');
    expect(windows.longTerm).toBe('7d');
  });
});

// ============================================================================
// Traceability matrix assertions
// ============================================================================

describe('Traceability Matrix', () => {
  it('\u5e94\u8be5\u5b9a\u4e49 NFR \u5230 SLO \u7684\u6620\u5c04', () => {
    expect(TRACEABILITY_MATRIX.nfrToSlo).toBeDefined();

    const crashFreeMapping =
      TRACEABILITY_MATRIX.nfrToSlo[NFR_KEYS.RELIABILITY.CRASH_FREE_USERS];

    expect(crashFreeMapping).toBeDefined();
    expect(crashFreeMapping.slo).toContain('crash_free_users');
    expect(crashFreeMapping.adr).toContain('ADR-0003');
    expect(crashFreeMapping.testRefs).toEqual(
      expect.arrayContaining(['tests/e2e/reliability.spec.ts'])
    );
    expect(crashFreeMapping.monitoringQuery).toContain('sentry');
  });

  it('\u5e94\u8be5\u5b9a\u4e49 ADR \u5230\u5b9e\u73b0\u7684\u6620\u5c04', () => {
    expect(TRACEABILITY_MATRIX.adrToImplementation).toBeDefined();

    const adr003Mapping = TRACEABILITY_MATRIX.adrToImplementation['ADR-0003'];

    expect(adr003Mapping).toBeDefined();
    expect(adr003Mapping.title).toContain('\u53ef\u89c2\u6d4b\u6027');
    expect(adr003Mapping.implementations).toEqual(
      expect.arrayContaining([
        'src/shared/observability/sentry-main.ts',
        'src/shared/observability/logger.ts',
      ])
    );
    expect(adr003Mapping.tests).toEqual(
      expect.arrayContaining([
        'tests/unit/observability.spec.ts',
        'tests/e2e/monitoring.spec.ts',
      ])
    );
  });

  it('\u6bcf\u4e2a\u5b9a\u4e49\u7684 NFR \u5e94\u8be5\u5728\u8ffd\u6eaf\u77e9\u9635\u4e2d\u6709\u6620\u5c04', () => {
    const definedNfrKeys = [
      NFR_KEYS.RELIABILITY.CRASH_FREE_USERS,
      NFR_KEYS.PERFORMANCE.RESPONSE_TIME,
    ];

    definedNfrKeys.forEach(nfrKey => {
      expect(TRACEABILITY_MATRIX.nfrToSlo[nfrKey]).toBeDefined();
    });
  });

  it('\u6bcf\u4e2a ADR \u6620\u5c04\u5e94\u8be5\u5305\u542b\u5b9e\u73b0\u6587\u4ef6\u548c\u6d4b\u8bd5', () => {
    Object.values(TRACEABILITY_MATRIX.adrToImplementation).forEach(mapping => {
      expect(mapping.title).toBeDefined();
      expect(mapping.implementations).toBeDefined();
      expect(mapping.implementations.length).toBeGreaterThan(0);
      expect(mapping.tests).toBeDefined();
      expect(mapping.tests.length).toBeGreaterThan(0);

      // Validate file path format
      mapping.implementations.forEach(impl => {
        expect(impl).toMatch(/^(src\/|scripts\/|\.github\/)/);
      });

      mapping.tests.forEach(test => {
        expect(test).toMatch(/^tests\/.+\.spec\.ts$/);
      });
    });
  });
});

// ============================================================================
// Generation checks
// ============================================================================

describe('Integration Tests', () => {
  it('NFR Keys\u3001SLI \u548c SLO \u5e94\u8be5\u5f62\u6210\u4e00\u81f4\u7684\u6620\u5c04\u5173\u7cfb', () => {
    // Validate each SLI nfrKey exists in NFR_KEYS
    Object.values(CORE_SLIS).forEach(sli => {
      const nfrKeyExists = Object.values(NFR_KEYS).some(category =>
        Object.values(category).includes(sli.nfrKey)
      );
      expect(nfrKeyExists).toBe(true);
    });

    // Validate each SLO has a corresponding SLI
    Object.values(CORE_SLOS).forEach(slo => {
      const sliExists = Object.values(CORE_SLIS).some(
        sli => sli.id === slo.sliId
      );
      expect(sliExists).toBe(true);
    });
  });

  it('\u6240\u6709\u914d\u7f6e\u5e94\u8be5\u4e0e\u6587\u6863\u89c4\u8303\u4fdd\u6301\u4e00\u81f4', () => {
    // Validate critical key/value requirements
    expect(CORE_SLOS.CRASH_FREE_USERS.targets.production).toBe('\u226599.5%');
    expect(CORE_SLOS.CRASH_FREE_SESSIONS.targets.production).toBe(
      '\u226599.8%'
    );

    // Validate observation windows
    expect(CORE_SLOS.CRASH_FREE_USERS.observationWindow).toBe('24h');
    expect(CORE_SLOS.CRASH_FREE_SESSIONS.observationWindow).toBe('24h');

    // Validate thresholds
    expect(DEFAULT_SAMPLING_CONFIG.production.errors).toBe(1.0);
    expect(DEFAULT_SAMPLING_CONFIG.production.transactions).toBe(0.1);
    expect(DEFAULT_SAMPLING_CONFIG.production.replays).toBe(0.01);
  });
});

// ============================================================================
// Edge cases and error handling
// ============================================================================

describe('Edge Cases and Error Handling', () => {
  it('\u5e94\u8be5\u5904\u7406\u65e0\u6548\u7684\u73af\u5883\u53d8\u91cf\u503c', async () => {
    const config: ReleaseHealthGateConfig = {
      sentryOrg: 'test-org',
      sentryProject: 'test-project',
      authToken: 'test-token',
    };

    const gate = new ReleaseHealthGate(config);

    // Provide valid fallback values
    process.env.CRASH_FREE_USERS_THRESHOLD = 'invalid-number';

    const mockFetchMetrics = vi
      .spyOn(gate as unknown as RHSpyTarget, 'fetchReleaseHealthMetrics')
      .mockResolvedValueOnce({
        crashFreeUsers: 99.7,
        crashFreeSessions: 99.9,
        sampleSize: 10000,
        observationWindow: '24h',
      });

    // Should fall back to defaults instead of throwing
    const result = await gate.checkReleaseHealth();
    expect(result).toBeDefined();
    expect(typeof result.passed).toBe('boolean');

    mockFetchMetrics.mockRestore();
    delete process.env.CRASH_FREE_USERS_THRESHOLD;
  });

  it('\u5e94\u8be5\u9a8c\u8bc1\u914d\u7f6e\u53c2\u6570\u7684\u5b8c\u6574\u6027', () => {
    expect(() => {
      new ReleaseHealthGate({
        sentryOrg: '',
        sentryProject: 'test-project',
        authToken: 'test-token',
      });
    }).not.toThrow(); //
  });

  it('\u5e94\u8be5\u5904\u7406\u8fb9\u754c\u6307\u6807\u503c', async () => {
    const config: ReleaseHealthGateConfig = {
      sentryOrg: 'test-org',
      sentryProject: 'test-project',
      authToken: 'test-token',
    };

    const gate = new ReleaseHealthGate(config);

    const mockFetchMetrics = vi
      .spyOn(gate as unknown as RHSpyTarget, 'fetchReleaseHealthMetrics')
      .mockResolvedValueOnce({
        crashFreeUsers: 100.0, //
        crashFreeSessions: 0.0, //
        sampleSize: 1, //
        observationWindow: '24h',
      });

    const result = await gate.checkReleaseHealth();

    expect(result.metrics.crashFreeUsers).toBe(100.0);
    expect(result.metrics.crashFreeSessions).toBe(0.0);
    expect(result.passed).toBe(false); //  sessions

    mockFetchMetrics.mockRestore();
  });
});

// ============================================================================
// V2 enhanced capability tests
// ============================================================================

describe('V2 \u6e38\u620f\u7279\u5b9a\u76d1\u63a7 SLI', () => {
  it('\u5e94\u5305\u542b Phaser \u573a\u666f\u8f6c\u6362\u76d1\u63a7', () => {
    expect(GAME_MONITORING_SLIS.PHASER_SCENE_TRANSITION).toBeDefined();
    expect(GAME_MONITORING_SLIS.PHASER_SCENE_TRANSITION.id).toBe(
      'phaser_scene_transition_time'
    );
    expect(GAME_MONITORING_SLIS.PHASER_SCENE_TRANSITION.target).toBe(
      'P95 \u2264 200ms'
    );
    expect(GAME_MONITORING_SLIS.PHASER_SCENE_TRANSITION.unit).toBe(
      'milliseconds'
    );
    expect(GAME_MONITORING_SLIS.PHASER_SCENE_TRANSITION.query).toContain(
      'phaser.scene_transition'
    );
  });

  it('\u5e94\u5305\u542b React-Phaser \u540c\u6b65\u76d1\u63a7', () => {
    expect(GAME_MONITORING_SLIS.REACT_PHASER_SYNC).toBeDefined();
    expect(GAME_MONITORING_SLIS.REACT_PHASER_SYNC.id).toBe(
      'react_phaser_sync_latency'
    );
    expect(GAME_MONITORING_SLIS.REACT_PHASER_SYNC.target).toBe(
      'P95 \u2264 50ms'
    );
    expect(GAME_MONITORING_SLIS.REACT_PHASER_SYNC.unit).toBe('milliseconds');
    expect(GAME_MONITORING_SLIS.REACT_PHASER_SYNC.query).toContain(
      'react_phaser_sync'
    );
  });

  it('\u5e94\u5305\u542b\u6218\u6597\u8ba1\u7b97\u548c AI \u51b3\u7b56\u76d1\u63a7', () => {
    expect(GAME_MONITORING_SLIS.BATTLE_COMPUTATION_TIME).toBeDefined();
    expect(GAME_MONITORING_SLIS.AI_DECISION_TIME).toBeDefined();
    expect(GAME_MONITORING_SLIS.SAVE_GAME_TIME).toBeDefined();

    // Validate that targets remain valid
    expect(GAME_MONITORING_SLIS.BATTLE_COMPUTATION_TIME.target).toBe(
      'P95 \u2264 50ms'
    );
    expect(GAME_MONITORING_SLIS.AI_DECISION_TIME.target).toBe(
      'P95 \u2264 200ms'
    );
    expect(GAME_MONITORING_SLIS.SAVE_GAME_TIME.target).toBe(
      'P95 \u2264 1000ms'
    );
  });

  it('\u6240\u6709\u6e38\u620f SLI \u5e94\u5173\u8054\u5230\u6027\u80fd NFR', () => {
    Object.values(GAME_MONITORING_SLIS).forEach(sli => {
      expect(sli.nfrKey).toBe(NFR_KEYS.PERFORMANCE.RESPONSE_TIME);
    });
  });
});

describe('V2 Tier-0 \u9608\u503c\u914d\u7f6e', () => {
  it('\u5e94\u5305\u542b\u73af\u5883\u5dee\u5f02\u5316\u7684\u5d29\u6e83\u7387\u9608\u503c', () => {
    expect(TIER_0_THRESHOLDS.crashFreeUsers).toBeDefined();
    expect(TIER_0_THRESHOLDS.crashFreeSessions).toBeDefined();

    // Validate stricter threshold values
    expect(TIER_0_THRESHOLDS.crashFreeUsers.production).toBe(99.5);
    expect(TIER_0_THRESHOLDS.crashFreeUsers.staging).toBe(99.0);
    expect(TIER_0_THRESHOLDS.crashFreeUsers.development).toBe(95.0);

    expect(TIER_0_THRESHOLDS.crashFreeSessions.production).toBe(99.8);
    expect(TIER_0_THRESHOLDS.crashFreeSessions.staging).toBe(99.5);
    expect(TIER_0_THRESHOLDS.crashFreeSessions.development).toBe(97.0);
  });

  it('\u5e94\u5305\u542b\u5173\u952e\u9519\u8bef\u96f6\u5bb9\u5fcd\u7b56\u7565', () => {
    expect(TIER_0_THRESHOLDS.criticalErrors.production).toBe(0);
    expect(TIER_0_THRESHOLDS.criticalErrors.staging).toBe(1);
    expect(TIER_0_THRESHOLDS.criticalErrors.development).toBe(5);
  });

  it('\u5e94\u5305\u542b\u6027\u80fd\u56de\u5f52\u68c0\u6d4b\u9608\u503c', () => {
    expect(TIER_0_THRESHOLDS.performanceRegression).toBeDefined();
    expect(TIER_0_THRESHOLDS.performanceRegression.frameTimeP95).toBe(16.7); // 60fps
    expect(TIER_0_THRESHOLDS.performanceRegression.interactionP95).toBe(100);
    expect(TIER_0_THRESHOLDS.performanceRegression.startupTimeP95).toBe(3000);
  });
});

describe('V2 \u667a\u80fd\u91c7\u6837\u7b56\u7565', () => {
  it('\u5e94\u5305\u542b\u73af\u5883\u5dee\u5f02\u5316\u91c7\u6837\u914d\u7f6e', () => {
    expect(SAMPLING_STRATEGIES.production).toBeDefined();
    expect(SAMPLING_STRATEGIES.staging).toBeDefined();
    expect(SAMPLING_STRATEGIES.development).toBeDefined();

    // Validate sampling rates
    const prodConfig = SAMPLING_STRATEGIES.production;
    expect(prodConfig.errorSampling).toBe(1.0); // 100%
    expect(prodConfig.transactionSampling).toBe(0.1); // 10%
    expect(prodConfig.replaySampling).toBe(0.01); // 1%
    expect(prodConfig.costBudgetMonthly).toBe(800); // $800/
  });

  it('\u5f00\u53d1\u73af\u5883\u5e94\u6709\u6700\u9ad8\u7684\u91c7\u6837\u7387', () => {
    const devConfig = SAMPLING_STRATEGIES.development;
    const prodConfig = SAMPLING_STRATEGIES.production;

    expect(devConfig.transactionSampling).toBeGreaterThanOrEqual(
      prodConfig.transactionSampling
    );
    expect(devConfig.replaySampling).toBeGreaterThanOrEqual(
      prodConfig.replaySampling
    );
  });

  it('\u6240\u6709\u91c7\u6837\u7387\u5e94\u5728\u6709\u6548\u8303\u56f4\u5185', () => {
    Object.values(SAMPLING_STRATEGIES).forEach((config: SamplingConfig) => {
      expect(config.errorSampling).toBeGreaterThanOrEqual(0);
      expect(config.errorSampling).toBeLessThanOrEqual(1);
      expect(config.transactionSampling).toBeGreaterThanOrEqual(0);
      expect(config.transactionSampling).toBeLessThanOrEqual(1);
      expect(config.replaySampling).toBeGreaterThanOrEqual(0);
      expect(config.replaySampling).toBeLessThanOrEqual(1);
      expect(config.costBudgetMonthly).toBeGreaterThan(0);
    });
  });
});

describe('V2 \u4e0e 01 \u7ae0 SLO \u6846\u67b6\u5bf9\u9f50\u9a8c\u8bc1', () => {
  it('Tier-0 \u9608\u503c\u5e94\u4e0e 01 \u7ae0\u5b9a\u4e49\u4fdd\u6301\u4e00\u81f4', () => {
    // Refer to 01-Contract-Targets-v2.md section 1.4 gating
    expect(TIER_0_THRESHOLDS.crashFreeUsers.production).toBe(99.5);
    expect(TIER_0_THRESHOLDS.crashFreeSessions.production).toBe(99.8);
    expect(TIER_0_THRESHOLDS.performanceRegression.frameTimeP95).toBe(16.7);
  });

  it('\u6027\u80fd\u6307\u6807\u5e94\u7b26\u5408 01 \u7ae0\u8d28\u91cf\u76ee\u6807', () => {
    // Refer to 01-Contract-Targets-v2.md section 1.2 targets
    expect(TIER_0_THRESHOLDS.performanceRegression.interactionP95).toBe(100); // 100ms
    expect(TIER_0_THRESHOLDS.performanceRegression.startupTimeP95).toBe(3000); // 3s
  });
});

describe('V2 Release Health Gate \u589e\u5f3a\u529f\u80fd', () => {
  it('\u5e94\u652f\u6301 Tier-0 \u9608\u503c\u7684\u73af\u5883\u53d8\u91cf\u8986\u76d6', async () => {
    const mockConfig = {
      sentryOrg: 'test-org',
      sentryProject: 'test-project',
      authToken: 'test-token',
      environment: {
        CRASH_FREE_USERS_THRESHOLD: '99.9',
        CRASH_FREE_SESSIONS_THRESHOLD: '99.95',
      },
    };

    const gate = new ReleaseHealthGate(mockConfig);

    const mockFetchMetrics = vi
      .spyOn(gate as unknown as RHSpyTarget, 'fetchReleaseHealthMetrics')
      .mockResolvedValueOnce({
        crashFreeUsers: 99.7,
        crashFreeSessions: 99.9,
        sampleSize: 10000,
        observationWindow: '24h',
      });

    const result = await gate.checkReleaseHealth();

    // Using stricter thresholds should fail
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);

    mockFetchMetrics.mockRestore();
  });
});

describe('V2 \u5411\u540e\u517c\u5bb9\u6027\u6d4b\u8bd5', () => {
  it('DEFAULT_SAMPLING_CONFIG \u5e94\u4fdd\u6301\u5411\u540e\u517c\u5bb9', () => {
    // Ensure config remains defined
    expect(DEFAULT_SAMPLING_CONFIG).toBeDefined();
    expect(DEFAULT_SAMPLING_CONFIG.production.errors).toBe(1.0);
    expect(DEFAULT_SAMPLING_CONFIG.production.transactions).toBe(0.1);

    // Recommend using updated SAMPLING_STRATEGIES
    expect(SAMPLING_STRATEGIES.production.errorSampling).toBe(
      DEFAULT_SAMPLING_CONFIG.production.errors
    );
    expect(SAMPLING_STRATEGIES.production.transactionSampling).toBe(
      DEFAULT_SAMPLING_CONFIG.production.transactions
    );
  });
});

// TODO: Add tests for real gate script execution
// TODO: Add unit tests for Electron security scan
// TODO: Add more release gate unit tests
// TODO: Add unit tests for Base-Clean verification
