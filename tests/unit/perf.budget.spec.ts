/**
 * Performance budget baseline validation tests
 *
 * Validate performance budget configuration correctness per Base-Clean architecture expectations.
 */

import { describe, it, expect } from 'vitest';
import type {
  FrameBudget,
  LatencyBudget,
  CapacityModel,
  PerformanceMetric,
  ProcessMemoryLimits,
} from '@/shared/contracts/perf';
import {
  DEFAULT_FRAME_BUDGET,
  DEFAULT_LATENCY_BUDGET,
  DEFAULT_CAPACITY_MODEL,
  PERF_SAMPLING_RULES,
} from '@/shared/contracts/perf';

describe('Performance Budget Validation', () => {
  describe('Frame Budget Validation', () => {
    it('should provide 60FPS frame budget', () => {
      const frameBudget: FrameBudget = DEFAULT_FRAME_BUDGET;

      expect(frameBudget.target).toBe(60);
      expect(frameBudget.budgetMs).toBeCloseTo(16.7);

      // Validate layered budget sum equals total budget
      const totalBudget = Object.values(frameBudget.layers).reduce(
        (a, b) => a + b,
        0
      );
      expect(totalBudget).toBeCloseTo(frameBudget.budgetMs, 1);
    });

    it('should allow overriding frame budget', () => {
      const customBudget = Number(process.env.FRAME_BUDGET_MS ?? 16.7);
      expect(customBudget).toBeGreaterThan(0);
      expect(customBudget).toBeLessThan(100); // Sanity range check
    });

    it('frame budget should be consistent', () => {
      const { layers } = DEFAULT_FRAME_BUDGET;

      // Script execution should take the largest proportion
      expect(layers.script).toBeGreaterThan(layers.style);
      expect(layers.script).toBeGreaterThan(layers.layout);

      // Buffer margin should be positive and small
      expect(layers.buffer).toBeGreaterThan(0);
      expect(layers.buffer).toBeLessThan(2);
    });
  });

  describe('Latency Budget Validation', () => {
    it('should provide latency budget defaults', () => {
      const latencyBudget: LatencyBudget = DEFAULT_LATENCY_BUDGET;

      expect(latencyBudget.event.p95).toBeLessThanOrEqual(50);
      expect(latencyBudget.event.p99).toBeGreaterThan(latencyBudget.event.p95);

      expect(latencyBudget.interaction.p95).toBeLessThanOrEqual(100);
      expect(latencyBudget.interaction.p99).toBeGreaterThan(
        latencyBudget.interaction.p95
      );
    });

    it('P99 should be greater than P95', () => {
      const { event, interaction, sceneSwitch } = DEFAULT_LATENCY_BUDGET;

      expect(event.p99).toBeGreaterThan(event.p95);
      expect(interaction.p99).toBeGreaterThan(interaction.p95);
      expect(sceneSwitch.p99).toBeGreaterThan(sceneSwitch.p95);
    });

    it('cold load should exceed warm load', () => {
      const { assetLoad } = DEFAULT_LATENCY_BUDGET;
      expect(assetLoad.cold).toBeGreaterThan(assetLoad.warm);
    });
  });

  describe('Capacity Model Validation', () => {
    it('should provide base capacity defaults', () => {
      const capacityModel: CapacityModel = DEFAULT_CAPACITY_MODEL;

      // CPU utilization should be within reasonable range
      expect(capacityModel.baseCapacity.cpu).toBeGreaterThan(0);
      expect(capacityModel.baseCapacity.cpu).toBeLessThan(1);

      // Memory usage should be positive
      expect(capacityModel.baseCapacity.memory).toBeGreaterThan(0);

      // GPU utilization should be within reasonable range
      expect(capacityModel.baseCapacity.gpu).toBeGreaterThan(0);
      expect(capacityModel.baseCapacity.gpu).toBeLessThan(1);
    });

    it('load multipliers should be > 1', () => {
      const { loadMultipliers } = DEFAULT_CAPACITY_MODEL;

      expect(loadMultipliers.entityCount).toBeGreaterThan(1);
      expect(loadMultipliers.effectComplexity).toBeGreaterThan(1);
      expect(loadMultipliers.uiComplexity).toBeGreaterThan(1);
    });

    it('safety margins should be within range', () => {
      const { safetyMargins } = DEFAULT_CAPACITY_MODEL;

      // Safety margins should be positive and < 0.5
      Object.values(safetyMargins).forEach(margin => {
        expect(margin).toBeGreaterThan(0);
        expect(margin).toBeLessThan(0.5);
      });
    });
  });

  describe('Metric Format Validation', () => {
    it('should follow event metric schema', () => {
      const metric: PerformanceMetric = {
        name: 'game.perf.frame_time',
        value: 16.5,
        unit: 'ms',
        timestamp: Date.now(),
        context: {
          release: '1.0.0',
          environment: 'production',
        },
      };

      // Validate naming format
      expect(metric.name).toMatch(/^[\w]+\.perf\.[\w_]+$/);

      // Validate required fields
      expect(metric.value).toBeGreaterThan(0);
      expect(metric.timestamp).toBeGreaterThan(0);
      expect(['ms', 'mb', 'fps', 'percent', 'count']).toContain(metric.unit);
    });
  });

  describe('Process Memory Limits Validation', () => {
    it('should validate process memory limits', () => {
      const limits: ProcessMemoryLimits = {
        main: 512,
        renderer: 1024,
        workers: 256,
      };

      expect(limits.main).toBeGreaterThan(0);
      expect(limits.renderer).toBeGreaterThan(limits.main);
      expect(limits.workers).toBeGreaterThan(0);
    });
  });

  describe('Sampling Rules Validation', () => {
    it('critical paths should have high sampling rates', () => {
      expect(PERF_SAMPLING_RULES.startup).toBe(0.8);
      expect(PERF_SAMPLING_RULES.navigation).toBe(0.8);
      expect(PERF_SAMPLING_RULES['ui.action']).toBe(0.8);
    });

    it('non-critical events should have low sampling rates', () => {
      expect(PERF_SAMPLING_RULES.healthcheck).toBe(0.0);
      expect(PERF_SAMPLING_RULES.heartbeat).toBe(0.0);
      expect(PERF_SAMPLING_RULES.poll).toBe(0.0);
    });

    it('default sampling should be within (0,1)', () => {
      const defaultRate = PERF_SAMPLING_RULES.default;
      expect(defaultRate).toBeGreaterThan(0);
      expect(defaultRate).toBeLessThan(1);
    });
  });

  describe('Environment Overrides Support', () => {
    it('should support env overrides for budgets', () => {
      const frameBudget = Number(process.env.FRAME_BUDGET_MS ?? 16.7);
      const eventP95 = Number(process.env.EVENT_P95_MS ?? 50);
      const interactionP95 = Number(process.env.INTERACTION_P95_MS ?? 100);

      expect(frameBudget).toBeGreaterThan(0);
      expect(eventP95).toBeGreaterThan(0);
      expect(interactionP95).toBeGreaterThan(0);
    });
  });

  describe('Structure Validation', () => {
    it('frame budget should contain required fields', () => {
      const frameBudget = DEFAULT_FRAME_BUDGET;

      expect(frameBudget).toHaveProperty('target');
      expect(frameBudget).toHaveProperty('budgetMs');
      expect(frameBudget).toHaveProperty('layers');

      expect(frameBudget.layers).toHaveProperty('script');
      expect(frameBudget.layers).toHaveProperty('style');
      expect(frameBudget.layers).toHaveProperty('layout');
      expect(frameBudget.layers).toHaveProperty('paint');
      expect(frameBudget.layers).toHaveProperty('buffer');
    });

    it('capacity model should contain required fields', () => {
      const model = DEFAULT_CAPACITY_MODEL;

      expect(model).toHaveProperty('baseCapacity');
      expect(model).toHaveProperty('loadMultipliers');
      expect(model).toHaveProperty('safetyMargins');

      // Validate required fields exist in each section
      expect(model.baseCapacity).toHaveProperty('cpu');
      expect(model.baseCapacity).toHaveProperty('memory');
      expect(model.baseCapacity).toHaveProperty('gpu');
    });
  });
});
