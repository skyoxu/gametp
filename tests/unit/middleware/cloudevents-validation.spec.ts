/**
 * CloudEvents real-time validation middleware tests (English-only)
 * NOTE: Titles and comments are ASCII-only. Test logic remains unchanged.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CloudEventsValidator,
  cloudEventsValidator,
  validateEvent as validateEventGlobal,
  validateEvents as validateEventsGlobal,
} from '../../../src/shared/middleware/cloudevents-validation.js';
import {
  mkEvent,
  type CloudEvent,
} from '../../../src/shared/contracts/cloudevents-core.js';

// Test-only helper types to avoid explicit any
type UnknownEvent = Record<string, unknown>;
type EventLike = CloudEvent | UnknownEvent;
type ExpressLikeReq = { headers: Record<string, string>; body: EventLike };
type ExpressLikeRes = {
  status: (code: number) => ExpressLikeRes;
  json: (body: unknown) => void;
};

describe('CloudEventsValidator', () => {
  let validator: CloudEventsValidator;

  beforeEach(() => {
    validator = new CloudEventsValidator();
    validator.resetStats();
  });

  describe('Validation Basics', () => {
    it('should validate a valid CloudEvent', () => {
      const validEvent = mkEvent({ source: 'app://test', type: 'test.event' });
      expect(validator.validate(validEvent)).toBe(true);

      const stats = validator.getStats();
      expect(stats.totalValidated).toBe(1);
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorRate).toBe(0);
    });

    it('should reject an invalid CloudEvent', () => {
      const invalidEvent = {
        id: 'test-123',
        source: 'app://test',
      } as UnknownEvent; // type/specversion missing
      expect(validator.validate(invalidEvent)).toBe(false);

      const stats = validator.getStats();
      expect(stats.totalValidated).toBe(1);
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorRate).toBe(1);
      expect(stats.lastError).toBeDefined();
    });

    it('should record validation context for errors', () => {
      const invalidEvent = { invalid: true } as UnknownEvent;
      const context = 'test-context';
      validator.validate(invalidEvent, context);
      const lastError = validator.getLastError();
      expect(lastError?.context).toBe(context);
    });
  });

  describe('Strict Mode', () => {
    it('should throw in strict mode', () => {
      validator.configure({ strictMode: true });
      expect(() =>
        validator.validate({ invalid: true } as UnknownEvent)
      ).toThrow();
    });

    it('should not throw in non-strict mode', () => {
      validator.configure({ strictMode: false });
      expect(() =>
        validator.validate({ invalid: true } as UnknownEvent)
      ).not.toThrow();
    });
  });

  describe('Batch Validation', () => {
    it('should classify valid and invalid events correctly', () => {
      const validEvent = mkEvent({ source: 'app://test', type: 'test.valid' });
      const invalidEvent = { invalid: true } as UnknownEvent;
      const events = [validEvent, invalidEvent, validEvent] as EventLike[];
      const result = validator.validateBatch(events, 'batch-test');
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].index).toBe(1);
    });
  });

  describe('Event Listeners', () => {
    it('should notify error listeners', () => {
      const errorListener = vi.fn();
      const unsubscribe = validator.onError(errorListener);

      validator.validate({ invalid: true } as UnknownEvent, 'listener-test');

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          context: 'listener-test',
          error: expect.any(String),
          timestamp: expect.any(String),
        })
      );
      unsubscribe();
    });

    it('should support unsubscribe for error listeners', () => {
      const errorListener = vi.fn();
      const unsubscribe = validator.onError(errorListener);
      unsubscribe();
      validator.validate({ invalid: true } as UnknownEvent);
      expect(errorListener).not.toHaveBeenCalled();
    });
  });

  describe('Stats And Reports', () => {
    it('should generate correct validation report', () => {
      // Generate some validation data
      validator.validate(mkEvent({ source: 'app://test', type: 'test.valid' }));
      validator.validate({ invalid: true } as UnknownEvent);
      validator.validate({ invalid: true } as UnknownEvent);

      const report = validator.generateReport();
      expect(report.stats.totalValidated).toBe(3);
      expect(report.stats.totalErrors).toBe(2);
      expect(report.stats.errorRate).toBeCloseTo(2 / 3);
      // Ensure at least one non-empty recommendation exists
      expect(
        report.recommendations.some(
          (r: unknown) => typeof r === 'string' && /\S/.test(r as string)
        )
      ).toBe(true);
    });

    it('should cap error history length', () => {
      validator.configure({ maxErrorHistory: 2 });
      validator.validate({ error: 1 } as UnknownEvent);
      validator.validate({ error: 2 } as UnknownEvent);
      validator.validate({ error: 3 } as UnknownEvent);
      const errors = validator.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].originalEvent).toEqual({ error: 2 });
      expect(errors[1].originalEvent).toEqual({ error: 3 });
    });
  });

  describe('Middleware', () => {
    it('should pass valid events to next', () => {
      const middleware = validator.middleware();
      const nextFn = vi.fn();
      const validEvent = mkEvent({
        source: 'app://test',
        type: 'test.middleware',
      });
      middleware(validEvent, nextFn);
      expect(nextFn).toHaveBeenCalledWith(validEvent);
    });

    it('should block invalid events', () => {
      const middleware = validator.middleware();
      const nextFn = vi.fn();
      middleware({ invalid: true } as UnknownEvent, nextFn);
      expect(nextFn).not.toHaveBeenCalled();
    });
  });

  describe('Decorator', () => {
    it('should decorate method and validate input', () => {
      const decorator = validator.validateEvent('test-decorator');
      class TestClass {
        @decorator
        testMethod(_event: unknown) {
          return { processed: true };
        }
      }
      const instance = new TestClass();
      const validEvent = mkEvent({
        source: 'app://test',
        type: 'test.decorator',
      });
      const result = instance.testMethod(validEvent as unknown as CloudEvent);
      expect(result).toEqual({ processed: true });
    });
  });

  describe('Monitoring', () => {
    it('should start and stop monitoring', () => {
      vi.useFakeTimers();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      validator.configure({ enableLogging: true });
      for (let i = 0; i < 20; i++) {
        validator.validate({ invalid: i } as UnknownEvent);
      }
      const stop = validator.startMonitoring({
        intervalMs: 1000,
        alertThreshold: 0.05,
      });
      vi.advanceTimersByTime(1100);
      const firstCall = consoleSpy.mock.calls[0] || [];
      const logged = String(firstCall[0] ?? '');
      expect(logged).toContain('[CloudEvents]');
      expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
      stop();
      consoleSpy.mockRestore();
      vi.useRealTimers();
    });
  });
});

describe('Global Helpers', () => {
  beforeEach(() => {
    cloudEventsValidator.resetStats();
  });

  describe('validateEvent', () => {
    it('should use global validator instance', () => {
      const validEvent = mkEvent({ source: 'app://test', type: 'test.global' });
      expect(validateEventGlobal(validEvent)).toBe(true);
      const stats = cloudEventsValidator.getStats();
      expect(stats.totalValidated).toBe(1);
    });
  });

  describe('validateEvents', () => {
    it('should validate an array of events using global instance', () => {
      const events: EventLike[] = [
        mkEvent({ source: 'app://test', type: 'test.1' }),
        { invalid: true } as UnknownEvent,
        mkEvent({ source: 'app://test', type: 'test.2' }),
      ];
      const result = validateEventsGlobal(events, 'global-batch');
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
    });
  });
});

describe('Express Middleware', () => {
  it('should create Express middleware', () => {
    const middleware = cloudEventsValidator.expressMiddleware();
    // Mock Express request/response objects
    const req = {
      headers: { 'content-type': 'application/cloudevents+json' },
      body: mkEvent({ source: 'app://webhook', type: 'webhook.received' }),
    } as ExpressLikeReq;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as ExpressLikeRes;
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
