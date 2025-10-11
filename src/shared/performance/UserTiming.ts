/**
 * User Timing API
 * P95
 */

export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
  detail?: any;
}

export interface PerformanceMeasurement {
  name: string;
  startMark: string;
  endMark: string;
  duration: number;
  startTime: number;
  detail?: any;
}

export interface TimingThresholds {
  p95: number;
  p99: number;
  warning: number;
  critical: number;
}

/**
 * Note
 */
export class UserTimingManager {
  private static instance: UserTimingManager;
  private measurements: Map<string, number[]> = new Map();
  private thresholds: Map<string, TimingThresholds> = new Map();

  // Note
  private readonly CRITICAL_INTERACTIONS = {
    'app.startup': { p95: 3000, p99: 5000, warning: 2000, critical: 8000 },
    'game.scene.load': { p95: 1500, p99: 2500, warning: 1000, critical: 4000 },
    'ui.modal.open': { p95: 200, p99: 400, warning: 150, critical: 800 },
    'game.turn.process': { p95: 500, p99: 800, warning: 300, critical: 1500 },
    'data.save': { p95: 800, p99: 1200, warning: 500, critical: 2000 },
    'phaser.scene.create': {
      p95: 1000,
      p99: 1800,
      warning: 700,
      critical: 3000,
    },
    'react.component.mount': { p95: 100, p99: 200, warning: 50, critical: 500 },
    'electron.ipc.call': { p95: 50, p99: 100, warning: 30, critical: 200 },
  } as const;

  static getInstance(): UserTimingManager {
    if (!UserTimingManager.instance) {
      UserTimingManager.instance = new UserTimingManager();
    }
    return UserTimingManager.instance;
  }

  constructor() {
    // Note
    Object.entries(this.CRITICAL_INTERACTIONS).forEach(([name, thresholds]) => {
      this.thresholds.set(name, thresholds);
    });
  }

  /**
   * Note
   */
  mark(name: string, detail?: any): void {
    if (!performance || !performance.mark) {
      console.warn('[UserTiming] Performance API');
      return;
    }

    try {
      performance.mark(name, { detail });
      console.log(`[UserTiming] : ${name}`);
    } catch (error) {
      console.error('[UserTiming] :', error);
    }
  }

  /**
   * Note
   */
  measure(
    name: string,
    startMark: string,
    endMark?: string
  ): PerformanceMeasurement | null {
    if (!performance || !performance.measure) {
      console.warn('[UserTiming] Performance API');
      return null;
    }

    try {
      const measurement = performance.measure(name, startMark, endMark);
      const result: PerformanceMeasurement = {
        name,
        startMark,
        endMark: endMark || 'navigationStart',
        duration: measurement.duration,
        startTime: measurement.startTime,
        detail: measurement.detail,
      };

      // P95
      this.recordMeasurement(name, measurement.duration);

      // Note
      this.checkThresholds(name, measurement.duration);

      console.log(
        `[UserTiming] : ${name} = ${measurement.duration.toFixed(2)}ms`
      );
      return result;
    } catch (error) {
      console.error('[UserTiming] :', error);
      return null;
    }
  }

  /**
   * Note
   */
  async measureFunction<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<{ result: T; duration: number }> {
    const startMark = `${name}.start`;
    const endMark = `${name}.end`;

    this.mark(startMark);

    try {
      const result = await fn();
      this.mark(endMark);

      const measurement = this.measure(name, startMark, endMark);
      return {
        result,
        duration: measurement?.duration || 0,
      };
    } catch (error) {
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      throw error;
    }
  }

  /**
   * Note
   */
  private recordMeasurement(name: string, duration: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }

    const measurements = this.measurements.get(name)!;
    measurements.push(duration);

    // 100
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  /**
   * Note
   */
  private checkThresholds(name: string, duration: number): void {
    const threshold = this.thresholds.get(name);
    if (!threshold) return;

    if (duration > threshold.critical) {
      console.error(
        `[UserTiming]  : ${name} = ${duration.toFixed(2)}ms (: ${threshold.critical}ms)`
      );
    } else if (duration > threshold.warning) {
      console.warn(
        `[UserTiming]   : ${name} = ${duration.toFixed(2)}ms (: ${threshold.warning}ms)`
      );
    }
  }

  /**
   * P95
   */
  getP95(name: string): number | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => a - b);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[p95Index] ?? null;
  }

  /**
   * P99
   */
  getP99(name: string): number | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => a - b);
    const p99Index = Math.ceil(sorted.length * 0.99) - 1;
    return sorted[p99Index] ?? null;
  }

  /**
   * Note
   */
  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {};

    for (const [name] of this.measurements) {
      const measurements = this.measurements.get(name)!;
      const threshold = this.thresholds.get(name);

      if (measurements.length > 0) {
        const avg =
          measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const min = Math.min(...measurements);
        const max = Math.max(...measurements);
        const p95 = this.getP95(name);
        const p99 = this.getP99(name);

        report[name] = {
          count: measurements.length,
          avg: parseFloat(avg.toFixed(2)),
          min: parseFloat(min.toFixed(2)),
          max: parseFloat(max.toFixed(2)),
          p95: p95 ? parseFloat(p95.toFixed(2)) : null,
          p99: p99 ? parseFloat(p99.toFixed(2)) : null,
          threshold,
          status: this.getThresholdStatus(name, p95),
        };
      }
    }

    return report;
  }

  /**
   * Note
   */
  private getThresholdStatus(name: string, p95: number | null): string {
    const threshold = this.thresholds.get(name);
    if (!threshold || !p95) return 'unknown';

    if (p95 > threshold.critical) return 'critical';
    if (p95 > threshold.warning) return 'warning';
    if (p95 > threshold.p95) return 'elevated';
    return 'good';
  }

  /**
   * CI P95
   */
  assertP95Thresholds(): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    for (const [name] of this.thresholds) {
      const p95 = this.getP95(name);
      const threshold = this.thresholds.get(name)!;

      if (p95 && p95 > threshold.p95) {
        violations.push(
          `${name}: P95=${p95.toFixed(2)}ms  ${threshold.p95}ms`
        );
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Note
   */
  clearMeasurements(): void {
    this.measurements.clear();
    if (performance && performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance && performance.clearMeasures) {
      performance.clearMeasures();
    }
  }
}

// Note
export const userTiming = UserTimingManager.getInstance();

// Note
export const mark = (name: string, detail?: any) =>
  userTiming.mark(name, detail);
export const measure = (name: string, startMark: string, endMark?: string) =>
  userTiming.measure(name, startMark, endMark);
export const measureFunction = <T>(name: string, fn: () => Promise<T> | T) =>
  userTiming.measureFunction(name, fn);
