/**
 *
 *  P95
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PerformanceCollector,
  PerformanceTestUtils,
  p95,
} from '../../tests/utils/PerformanceTestUtils';

describe('P95 ', () => {
  let collector: PerformanceCollector;

  beforeEach(() => {
    collector = new PerformanceCollector();
  });

  describe('PerformanceCollector', () => {
    it(' P95 ', () => {
      // [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      const testData = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

      testData.forEach(value => {
        collector.addMetric('test', value);
      });

      const p95Value = collector.getP95('test');

      // P95  95%
      //  10 95%  9 (Math.ceil(10 * 0.95) - 1 = 9)
      expect(p95Value).toBe(100);
    });

    it('', () => {
      const testData = [10, 20, 30, 40, 50];

      testData.forEach(value => {
        collector.addMetric('average_test', value);
      });

      const avgValue = collector.getAverage('average_test');
      expect(avgValue).toBe(30); // (10+20+30+40+50)/5 = 30
    });

    it('', () => {
      expect(collector.getP95('nonexistent')).toBe(0);
      expect(collector.getAverage('nonexistent')).toBe(0);
      expect(collector.getSampleCount('nonexistent')).toBe(0);
    });

    it('', () => {
      collector.addMetric('count_test', 1);
      collector.addMetric('count_test', 2);
      collector.addMetric('count_test', 3);

      expect(collector.getSampleCount('count_test')).toBe(3);
    });
  });

  describe('P95 ', () => {
    it(' P95 ', () => {
      //  1: 20  (1-20)
      const data1 = Array.from({ length: 20 }, (_, i) => i + 1);
      const p95_1 = p95(data1);
      expect(p95_1).toBe(19); // Math.ceil(20 * 0.95) - 1 = 18, data[18] = 19

      //  2: 100  (1-100)
      const data2 = Array.from({ length: 100 }, (_, i) => i + 1);
      const p95_2 = p95(data2);
      expect(p95_2).toBe(95); // Math.ceil(100 * 0.95) - 1 = 94, data[94] = 95

      //  3:
      const data3 = [100, 50, 75, 25, 90, 10, 60, 80, 40, 30];
      const p95_3 = p95(data3);
      expect(p95_3).toBe(100); //  95%
    });

    it('', () => {
      expect(p95([42])).toBe(42); //
      expect(p95([1, 2])).toBe(2); // P95
    });
  });

  describe('PerformanceTestUtils ', () => {
    it('runP95Test ', async () => {
      let callCount = 0;

      const testFunction = async () => {
        callCount++;
        return Math.random() * 100; //
      };

      const stats = await PerformanceTestUtils.runP95Test(
        'test_metric',
        testFunction,
        200, //
        { sampleCount: 10, verbose: false }
      );

      expect(callCount).toBe(10);
      expect(stats.sampleCount).toBe(10);
      expect(stats.p95).toBeGreaterThan(0);
      expect(stats.average).toBeGreaterThan(0);
    }, 10000); //

    it(' P95 ', async () => {
      const testFunction = async () => {
        return 150; //
      };

      await expect(
        PerformanceTestUtils.runP95Test(
          'failing_test',
          testFunction,
          100, //
          { sampleCount: 5, verbose: false }
        )
      ).rejects.toThrow();
    });
  });
});
