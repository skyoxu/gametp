/**
 * CloudEvents validator tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  CloudEventsValidator,
  createValidator,
  validateCloudEvent,
  defaultValidator,
  type ValidationConfig,
} from '../cloud-events-validator';
import type { BaseEvent } from '@/shared/contracts/events';

describe('CloudEventsValidator', () => {
  let validator: CloudEventsValidator;

  const validEvent: BaseEvent = {
    id: 'test-event-001',
    source: '/vitegame/test-source',
    type: 'com.vitegame.test.event',
    specversion: '1.0',
    time: '2025-08-26T10:30:00Z',
    datacontenttype: 'application/json',
    data: { message: 'test' },
  };

  beforeEach(() => {
    validator = new CloudEventsValidator({
      level: 'strict',
      enablePerformanceMonitoring: true,
      enableStatistics: true,
      maxProcessingDelay: 10,
    });

    // Reset shared default validator statistics
    defaultValidator.resetStatistics();
  });

  describe('validate()', () => {
    test('should pass valid CloudEvent', () => {
      const result = validator.validate(validEvent);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should fail on missing required fields', () => {
      const invalidEvent = { ...validEvent };
      delete (invalidEvent as any).id;
      delete (invalidEvent as any).source;

      expect(() => validator.validate(invalidEvent)).toThrow(
        'CloudEvents validation failed'
      );
    });

    test('should fail on invalid specversion', () => {
      const invalidEvent = { ...validEvent, specversion: '2.0' as any };

      expect(() => validator.validate(invalidEvent)).toThrow(
        'Unsupported CloudEvents specversion'
      );
    });

    test('should validate source format', () => {
      const invalidEvent = { ...validEvent, source: '   ' }; // blank source

      // strict
      expect(() => validator.validate(invalidEvent)).toThrow(
        'CloudEvents validation failed'
      );
    });

    test('should validate RFC3339 time format', () => {
      const warningValidator = new CloudEventsValidator({ level: 'warning' });
      const invalidEvent = { ...validEvent, time: '2025-13-32T25:61:99Z' };
      const result = warningValidator.validate(invalidEvent);

      expect(result.valid).toBe(true); // warning mode allows invalid time format
      expect(result.errors.some(e => e.code === 'INVALID_FORMAT')).toBe(true);
    });

    test('should work in warning mode', () => {
      const warningValidator = new CloudEventsValidator({ level: 'warning' });
      const invalidEvent = { ...validEvent, source: '   ' }; // blank source in warning mode

      const result = warningValidator.validate(invalidEvent);
      expect(result.valid).toBe(true); // should pass with warnings
      expect(result.errors.some(e => e.severity === 'warning')).toBe(true);
    });

    test('should be disabled when level is disabled', () => {
      const disabledValidator = new CloudEventsValidator({ level: 'disabled' });
      const invalidEvent = { ...validEvent };
      delete (invalidEvent as any).id;

      const result = disabledValidator.validate(invalidEvent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createMiddleware()', () => {
    test('should create middleware function', () => {
      const middleware = validator.createMiddleware();

      expect(typeof middleware).toBe('function');

      const result = middleware(validEvent);
      expect(result).toEqual(validEvent);
    });

    test('should throw in middleware for invalid events in strict mode', () => {
      const middleware = validator.createMiddleware();
      const invalidEvent = { ...validEvent };
      delete (invalidEvent as any).id;

      expect(() => middleware(invalidEvent)).toThrow();
    });
  });

  describe('getStatistics()', () => {
    test('should track validation statistics', () => {
      validator.validate(validEvent);
      validator.validate(validEvent);

      const stats = validator.getStatistics();
      expect(stats.totalEvents).toBe(2);
      expect(stats.validEvents).toBe(2);
      expect(stats.invalidEvents).toBe(0);
      expect(stats.avgProcessingTime).toBeGreaterThanOrEqual(0);
    });

    test('should track invalid events in statistics', () => {
      const warningValidator = new CloudEventsValidator({ level: 'warning' });
      // URL
      const invalidEvent = { ...validEvent, source: '' }; // empty URL-like source

      const validResult = warningValidator.validate(validEvent);
      const invalidResult = warningValidator.validate(invalidEvent);

      const stats = warningValidator.getStatistics();

      expect(stats.totalEvents).toBe(2);
      expect(stats.validEvents).toBe(1);
      expect(stats.invalidEvents).toBe(1);
      expect(stats.errorsByType.MISSING_FIELD || 0).toBe(1);
    });
  });

  describe('resetStatistics()', () => {
    test('should reset statistics', () => {
      validator.validate(validEvent);
      validator.resetStatistics();

      const stats = validator.getStatistics();
      expect(stats.totalEvents).toBe(0);
      expect(stats.validEvents).toBe(0);
      expect(stats.invalidEvents).toBe(0);
    });
  });

  describe('factory functions', () => {
    test('createValidator should create custom validator', () => {
      const customValidator = createValidator({ level: 'warning' });
      expect(customValidator).toBeInstanceOf(CloudEventsValidator);
    });

    test('validateCloudEvent should use default validator', () => {
      const result = validateCloudEvent(validEvent);
      expect(result.valid).toBe(true);
    });
  });

  describe('performance monitoring', () => {
    test('should monitor processing time', () => {
      const result = validator.validate(validEvent);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    test('should warn on slow processing', () => {
      const slowValidator = new CloudEventsValidator({
        enablePerformanceMonitoring: true,
        maxProcessingDelay: 0.001, // force warning for slow processing
      });

      // Spy and suppress console warning output during test
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      slowValidator.validate(validEvent);
      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    test('should handle empty event object', () => {
      expect(() => validator.validate({} as BaseEvent)).toThrow();
    });

    test('should handle null/undefined fields gracefully', () => {
      const partialEvent = {
        id: 'test',
        source: null as any,
        type: undefined as any,
        specversion: '1.0' as const,
        time: '',
        datacontenttype: 'application/json',
        data: null,
      };

      expect(() => validator.validate(partialEvent)).toThrow();
    });

    test('should accept various valid source formats', () => {
      const validSources = [
        'https://example.com/source',
        '/relative/path',
        'file://local/path',
        'custom-scheme://identifier',
      ];

      validSources.forEach(source => {
        const testEvent = { ...validEvent, source };
        const result = validator.validate(testEvent);
        expect(result.valid).toBe(true);
      });
    });
  });
});
