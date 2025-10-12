/**
 * P95
 *  P95
 */

import { describe, it, expect } from 'vitest';
import {
  PerformanceCollector,
  p95,
} from '../../tests/utils/PerformanceTestUtils';

describe('P95 ', () => {
  it(' vs P95 ', () => {
    //
    //  (50-80ms) (150-200ms)
    const simulatedPerformanceData = [
      //  (85% )
      ...Array(17)
        .fill(0)
        .map(() => 50 + Math.random() * 30), // 50-80ms
      //  (15% )
      ...Array(3)
        .fill(0)
        .map(() => 150 + Math.random() * 50), // 150-200ms
    ];

    //
    for (let i = simulatedPerformanceData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [simulatedPerformanceData[i], simulatedPerformanceData[j]] = [
        simulatedPerformanceData[j],
        simulatedPerformanceData[i],
      ];
    }

    console.log(
      ':',
      simulatedPerformanceData.map(v => v.toFixed(1))
    );

    //
    const p95Value = p95(simulatedPerformanceData);
    const average =
      simulatedPerformanceData.reduce((a, b) => a + b) /
      simulatedPerformanceData.length;
    const max = Math.max(...simulatedPerformanceData);
    const min = Math.min(...simulatedPerformanceData);

    console.log(`:`);
    console.log(`  : ${min.toFixed(1)}ms`);
    console.log(`  : ${average.toFixed(1)}ms`);
    console.log(`  P95:  ${p95Value.toFixed(1)}ms`);
    console.log(`  : ${max.toFixed(1)}ms`);

    // P95
    expect(p95Value).toBeLessThan(max); // P95
    expect(p95Value).toBeGreaterThan(average); // P95
    expect(p95Value).toBeLessThan(200); // P95
  });

  it('', () => {
    //  10 "" 1
    const singlePointResults: number[] = [];
    const simulatedRuns = 10;

    for (let run = 0; run < simulatedRuns; run++) {
      // ""
      //  (70ms) 20%  (180ms)
      const singleMeasurement = Math.random() < 0.8 ? 70 : 180;
      singlePointResults.push(singleMeasurement);
    }

    console.log(':', singlePointResults);

    // "" 100ms
    const failuresCount = singlePointResults.filter(v => v > 100).length;
    const failureRate = failuresCount / simulatedRuns;

    console.log(
      `: ${(failureRate * 100).toFixed(1)}% (${failuresCount}/${simulatedRuns})`
    );

    //  P95
    const p95Samples: number[] = [];
    for (let i = 0; i < 25; i++) {
      // 80% 20%
      const sample = Math.random() < 0.8 ? 70 : 180;
      p95Samples.push(sample);
    }

    const p95Result = p95(p95Samples);
    const p95Passes = p95Result <= 100;

    console.log(`P95 : ${p95Result.toFixed(1)}ms`);
    console.log(`P95 : ${p95Passes}`);

    // P95  20% P95
    //  P95  5%
  });

  it(' P95 ', () => {
    //
    const testData = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]; // 10

    const p95Value = p95(testData);

    //  10 P95
    // Math.ceil(10 * 0.95) - 1 = Math.ceil(9.5) - 1 = 10 - 1 = 9
    //  P95  9  100
    expect(p95Value).toBe(100);

    //
    const largeData = Array.from({ length: 100 }, (_, i) => i + 1); // 1-100
    const p95Large = p95(largeData);

    //  100 Math.ceil(100 * 0.95) - 1 = 95 - 1 = 94
    //  P95  94  95
    expect(p95Large).toBe(95);
  });

  it(' PerformanceCollector ', () => {
    const collector = new PerformanceCollector();

    //
    const performanceData = [45, 55, 65, 75, 85, 95, 105, 115, 125, 135];

    performanceData.forEach(value => {
      collector.addMetric('test_metric', value);
    });

    const stats = collector.getStatistics('test_metric');

    expect(stats.sampleCount).toBe(10);
    expect(stats.average).toBe(90); // (45+55+...+135)/10 = 900/10 = 90
    expect(stats.min).toBe(45);
    expect(stats.max).toBe(135);
    expect(stats.p95).toBe(135); //  10 P95
  });
});
