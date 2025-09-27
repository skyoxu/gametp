/**
 * 
 *
 * Base-Clean,,.
 * (//Worker).
 */

/**
 * 
 *
 * 60FPS,
 */
export interface FrameBudget {
  /**  (FPS) */
  target: number;
  /**  () */
  budgetMs: number;
  /**  */
  layers: {
    /**  (ms) */
    script: number;
    /**  (ms) */
    style: number;
    /**  (ms) */
    layout: number;
    /**  (ms) */
    paint: number;
    /**  (ms) */
    buffer: number;
  };
}

/**
 * 
 *
 * ,P95/P99
 */
export interface LatencyBudget {
  /**  */
  event: {
    /** P95 (ms) */
    p95: number;
    /** P99 (ms) */
    p99: number;
  };
  /** UI */
  interaction: {
    /** P95 (ms) */
    p95: number;
    /** P99 (ms) */
    p99: number;
  };
  /**  */
  sceneSwitch: {
    /** P95 (ms) */
    p95: number;
    /** P99 (ms) */
    p99: number;
  };
  /**  */
  assetLoad: {
    /**  (ms) */
    cold: number;
    /**  (ms) */
    warm: number;
  };
}

/**
 * 
 *
 * ,
 */
export interface CapacityModel {
  /**  */
  baseCapacity: {
    /** CPU (0-1) */
    cpu: number;
    /**  (MB) */
    memory: number;
    /** GPU (0-1) */
    gpu: number;
  };
  /**  */
  loadMultipliers: {
    /**  */
    entityCount: number;
    /**  */
    effectComplexity: number;
    /** UI */
    uiComplexity: number;
  };
  /**  */
  safetyMargins: {
    /** CPU (0-1) */
    cpu: number;
    /**  (0-1) */
    memory: number;
    /** GPU (0-1) */
    gpu: number;
  };
}

/**
 * 
 *
 * 
 */
export interface PerformanceMetric {
  /** , ${DOMAIN}.perf.${metric}  */
  name: string;
  /**  */
  value: number;
  /**  */
  unit: 'ms' | 'mb' | 'fps' | 'percent' | 'count';
  /**  */
  timestamp: number;
  /**  */
  context: {
    /**  */
    release?: string;
    /**  */
    environment?: string;
    /**  */
    userAgent?: string;
    /** ID */
    sessionId?: string;
  };
}

/**
 * 
 *
 * 
 */
export interface PerformanceDegradation {
  /**  */
  triggers: {
    /**  */
    frameDrops: number;
    /**  (0-1) */
    memoryPressure: number;
    /** CPU (0-1) */
    cpuUsage: number;
  };
  /**  */
  actions: {
    /**  */
    reduceParticles: boolean;
    /**  */
    lowerResolution: boolean;
    /**  */
    disableEffects: boolean;
    /**  */
    simplifyGeometry: boolean;
  };
}

/**
 * 
 *
 * 
 */
export interface ProcessMemoryLimits {
  /**  (MB) */
  main: number;
  /**  (MB) */
  renderer: number;
  /** Worker (MB) */
  workers: number;
}

/**
 * 
 *
 * 
 */
export interface PerformanceRisk {
  /**  */
  id: string;
  /**  */
  description: string;
  /**  */
  probability: 'low' | 'medium' | 'high';
  /**  */
  impact: 'low' | 'medium' | 'high';
  /**  */
  mitigation: string;
  /**  */
  owner: string;
}

/**
 * 
 */
export interface StressTestScenario {
  /**  */
  name: string;
  /**  */
  entities: number;
  /**  */
  effects: number;
  /**  */
  duration: string;
}

/**
 * 
 */
export interface RegressionMatrix {
  /**  */
  scenarios: {
    [scenarioName: string]: {
      threshold: number;
      unit: string;
    };
  };
  /**  */
  environments: string[];
  /**  */
  browsers: string[];
  /**  */
  platforms: string[];
}

/**
 * 
 *
 * ,
 */
export const DEFAULT_FRAME_BUDGET: FrameBudget = {
  target: 60,
  budgetMs: 16.7,
  layers: {
    script: 8,
    style: 2,
    layout: 2,
    paint: 4,
    buffer: 0.7,
  },
};

export const DEFAULT_LATENCY_BUDGET: LatencyBudget = {
  event: { p95: 50, p99: 100 },
  interaction: { p95: 100, p99: 200 },
  sceneSwitch: { p95: 500, p99: 1000 },
  assetLoad: { cold: 3000, warm: 500 },
};

export const DEFAULT_CAPACITY_MODEL: CapacityModel = {
  baseCapacity: {
    cpu: 0.3,
    memory: 512,
    gpu: 0.5,
  },
  loadMultipliers: {
    entityCount: 1.2,
    effectComplexity: 1.5,
    uiComplexity: 1.1,
  },
  safetyMargins: {
    cpu: 0.2,
    memory: 0.15,
    gpu: 0.25,
  },
};

/**
 * 
 *
 * 03Sentry
 */
export const PERF_SAMPLING_RULES: Record<string, number> = {
  // 
  startup: 0.8,
  navigation: 0.8,
  'ui.action': 0.8,
  coldstart: 0.8,
  warmstart: 0.8,

  // 
  healthcheck: 0.0,
  heartbeat: 0.0,
  poll: 0.0,

  // 
  default: Number(process.env.TRACES_SAMPLE_BASE ?? 0.1),
};

