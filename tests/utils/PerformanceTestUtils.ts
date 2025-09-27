/**
 * Performance testing utilities (ASCII-only)
 *
 * Implements P95 sampling methodology to reduce single-sample noise.
 * Provides helpers to collect metrics and assert budgets in tests.
 */

import { expect } from '@playwright/test';

/**
 * Aggregator for named metrics with summary helpers.
 */
export class PerformanceCollector {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Add a metric value for the given name.
   * @param name Metric name
   * @param value Numeric value (milliseconds)
   */
  addMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) this.metrics.set(name, []);
    this.metrics.get(name)!.push(value);
  }

  /** Get P95 value for the metric name. */
  getP95(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }

  /** Get average value for the metric. */
  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /** Get max value for the metric. */
  getMax(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return Math.max(...values);
  }

  /** Get min value for the metric. */
  getMin(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return Math.min(...values);
  }

  /** Get number of samples for the metric. */
  getSampleCount(name: string): number {
    const values = this.metrics.get(name);
    return values ? values.length : 0;
  }

  /** Reset all metrics. */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Get statistics summary for a metric name.
   */
  getStatistics(name: string): PerformanceStatistics {
    return {
      sampleCount: this.getSampleCount(name),
      average: this.getAverage(name),
      p95: this.getP95(name),
      min: this.getMin(name),
      max: this.getMax(name),
    };
  }
}

/** Statistics summary shape. */
export interface PerformanceStatistics {
  sampleCount: number;
  average: number;
  p95: number;
  min: number;
  max: number;
}

/** Options for P95 sampling helpers. */
export interface P95SamplingOptions {
  /** Sample count (default 25). */
  sampleCount?: number;
  /** Interval in ms between samples for sequential mode (default 50). */
  sampleInterval?: number;
  /** Run samples in parallel (default false). */
  parallel?: boolean;
  /** Print statistics (default true). */
  verbose?: boolean;
}

export class PerformanceTestUtils {
  /**
   * Run a P95 sampling test around the provided function that returns a latency in ms.
   */
  static async runP95Test(
    testName: string,
    sampleFunction: () => Promise<number>,
    threshold: number,
    options: P95SamplingOptions = {}
  ): Promise<PerformanceStatistics> {
    const sampleCount = options.sampleCount ?? 25;
    const sampleInterval = options.sampleInterval ?? 50;
    const parallel = options.parallel ?? false;
    const verbose = options.verbose ?? true;

    const collector = new PerformanceCollector();

    if (parallel) {
      const values = await Promise.all(
        Array.from({ length: sampleCount }, () => sampleFunction())
      );
      values.forEach(v => collector.addMetric(testName, v));
    } else {
      for (let i = 0; i < sampleCount; i++) {
        const v = await sampleFunction();
        collector.addMetric(testName, v);
        if (i < sampleCount - 1 && sampleInterval > 0) {
          await new Promise(r => setTimeout(r, sampleInterval));
        }
      }
    }

    const stats = collector.getStatistics(testName);

    if (verbose) {
      console.log(`${testName} P95 sampling:`);
      console.log(`  samples: ${stats.sampleCount}`);
      console.log(`  p95: ${stats.p95.toFixed(2)}ms`);
      console.log(`  average: ${stats.average.toFixed(2)}ms`);
      console.log(`  min: ${stats.min.toFixed(2)}ms`);
      console.log(`  max: ${stats.max.toFixed(2)}ms`);
      console.log(`  threshold: ${threshold}ms`);
    }

    expect(stats.p95).toBeLessThanOrEqual(threshold);
    return stats;
  }

  /** Cold startup P95 sampling. */
  static async runColdStartupP95Test(
    startupFunction: () => Promise<number>,
    threshold: number,
    sampleCount: number = 15
  ): Promise<PerformanceStatistics> {
    return this.runP95Test('cold_startup', startupFunction, threshold, {
      sampleCount,
      sampleInterval: 100,
      parallel: false,
      verbose: true,
    });
  }

  /** Interaction response P95 sampling. */
  static async runInteractionP95Test(
    interactionFunction: () => Promise<number>,
    threshold: number,
    sampleCount: number = 30
  ): Promise<PerformanceStatistics> {
    return this.runP95Test(
      'interaction_response',
      interactionFunction,
      threshold,
      {
        sampleCount,
        sampleInterval: 50,
        parallel: false,
        verbose: true,
      }
    );
  }

  /** Concurrent operations P95 sampling. */
  static async runConcurrentP95Test(
    concurrentFunction: () => Promise<number>,
    threshold: number,
    sampleCount: number = 20
  ): Promise<PerformanceStatistics> {
    return this.runP95Test(
      'concurrent_operations',
      concurrentFunction,
      threshold,
      {
        sampleCount,
        sampleInterval: 25,
        parallel: true,
        verbose: true,
      }
    );
  }
}

/** Compute P95 for a numeric array. */
export function p95(arr: number[]): number {
  if (arr.length === 0) return 0;
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.ceil(a.length * 0.95) - 1];
}

/**
 * Example helper: click and wait for a selector, sampling response P95.
 */
export async function createP95SampleTest(
  page: {
    click: (selector: string) => Promise<void>;
    waitForSelector: (
      selector: string,
      options?: { state?: string }
    ) => Promise<void>;
  },
  selector: string,
  waitSelector: string,
  threshold: number,
  sampleCount: number = 30
): Promise<void> {
  const samples: number[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const t0 = performance.now();
    await page.click(selector);
    await page.waitForSelector(waitSelector, { state: 'visible' });
    samples.push(performance.now() - t0);
  }

  const p95Value = p95(samples);
  console.log(
    `P95 result: ${p95Value.toFixed(2)}ms (threshold: ${threshold}ms, samples: ${sampleCount})`
  );
  expect(p95Value).toBeLessThan(threshold);
}
