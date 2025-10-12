/**
 * CloudEvents 1.0 runtime validation middleware
 * - Enforce CloudEvents spec at runtime
 * - Optional performance monitoring and statistics
 * - Error aggregation with configurable severity level
 */

import type { BaseEvent } from '../contracts/events';

// ============================================================================
// Configuration and Types
// ============================================================================

export interface ValidationConfig {
  /** Validation level */
  level: 'strict' | 'warning' | 'disabled';
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Enable statistics collection */
  enableStatistics: boolean;
  /** Max processing delay (ms) before warning */
  maxProcessingDelay: number;
}

export interface ValidationError {
  code:
    | 'MISSING_FIELD'
    | 'INVALID_FORMAT'
    | 'INVALID_SPECVERSION'
    | 'INVALID_SOURCE';
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  processingTime: number;
  timestamp: string;
}

export interface ValidationStats {
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  avgProcessingTime: number;
  errorsByType: Record<string, number>;
  lastValidation: string;
}

// Default configuration
const ENV = (typeof process !== 'undefined' && process.env) || {};
const DEFAULT_CONFIG: ValidationConfig = {
  level: ((ENV.CLOUDEVENTS_VALIDATION_LEVEL as any) || 'strict') as
    | 'strict'
    | 'warning'
    | 'disabled',
  enablePerformanceMonitoring: (ENV.NODE_ENV ?? 'development') !== 'production',
  enableStatistics: true,
  maxProcessingDelay: Number(ENV.CLOUDEVENTS_MAX_DELAY_MS ?? '10'),
};

// ============================================================================
// CloudEvents Validator
// ============================================================================

export class CloudEventsValidator {
  private config: ValidationConfig;
  private stats: ValidationStats;
  private processingTimes: number[] = [];

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      totalEvents: 0,
      validEvents: 0,
      invalidEvents: 0,
      avgProcessingTime: 0,
      errorsByType: {},
      lastValidation: new Date().toISOString(),
    };
  }

  /** Validate a CloudEvents 1.0 event */
  validate(event: BaseEvent): ValidationResult {
    const startTime = this.config.enablePerformanceMonitoring
      ? performance.now()
      : 0;
    const errors: ValidationError[] = [];

    if (this.config.level === 'disabled') {
      return {
        valid: true,
        errors: [],
        processingTime: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // Validate required fields
    const requiredFields: Array<keyof BaseEvent> = [
      'id',
      'source',
      'specversion',
      'type',
    ];
    for (const field of requiredFields) {
      if (!event[field]) {
        errors.push({
          code: 'MISSING_FIELD',
          field: String(field),
          message: `Required CloudEvents field '${String(field)}' is missing`,
          severity: 'error',
        });
      }
    }

    // Validate specversion
    if (event.specversion && event.specversion !== '1.0') {
      errors.push({
        code: 'INVALID_SPECVERSION',
        field: 'specversion',
        message: `Unsupported CloudEvents specversion '${event.specversion}', expected '1.0'`,
        severity: 'error',
      });
    }

    // Validate source format (should be a URI reference)
    if (event.source && typeof event.source === 'string') {
      if (!this.isValidSourceFormat(event.source)) {
        errors.push({
          code: 'INVALID_SOURCE',
          field: 'source',
          message: `Invalid source format '${event.source}', should be a URI reference`,
          severity: this.config.level === 'strict' ? 'error' : 'warning',
        });
      }
    }

    // Validate time (RFC3339)
    if (event.time && typeof event.time === 'string') {
      if (!this.isValidRFC3339(event.time)) {
        errors.push({
          code: 'INVALID_FORMAT',
          field: 'time',
          message: `Invalid time format '${event.time}', should be RFC3339`,
          severity: this.config.level === 'strict' ? 'error' : 'warning',
        });
      }
    }

    // Performance monitoring
    let processingTime = 0;
    if (this.config.enablePerformanceMonitoring) {
      processingTime = performance.now() - startTime;
      this.updateProcessingStats(processingTime);

      if (processingTime > this.config.maxProcessingDelay) {
        console.warn(
          `CloudEvents validation took ${processingTime.toFixed(2)}ms (> ${this.config.maxProcessingDelay}ms threshold)`
        );
      }
    }

    // Update statistics
    if (this.config.enableStatistics) {
      this.updateStats(errors);
    }

    const result: ValidationResult = {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      processingTime,
      timestamp: new Date().toISOString(),
    };

    // Error handling
    if (!result.valid && this.config.level === 'strict') {
      const errorSummary = errors
        .filter(e => e.severity === 'error')
        .map(e => `${e.field}: ${e.message}`)
        .join('; ');

      throw new Error(`CloudEvents validation failed: ${errorSummary}`);
    }

    // Warning log
    if (errors.length > 0 && this.config.level === 'warning') {
      console.warn(`CloudEvents validation warnings:`, errors);
    }

    return result;
  }

  /** Create validation middleware function */
  createMiddleware() {
    return (event: BaseEvent): BaseEvent => {
      this.validate(event);
      return event;
    };
  }

  /** Get validation statistics snapshot */
  getStatistics(): ValidationStats {
    return { ...this.stats };
  }

  /** Reset validation statistics */
  resetStatistics(): void {
    this.stats = {
      totalEvents: 0,
      validEvents: 0,
      invalidEvents: 0,
      avgProcessingTime: 0,
      errorsByType: {},
      lastValidation: new Date().toISOString(),
    };
    this.processingTimes = [];
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private isValidSourceFormat(source: string): boolean {
    // Basic URI-reference format check (RFC 3986 4.1)
    try {
      // Allow both relative and absolute URIs
      return /^([a-zA-Z][a-zA-Z0-9+.-]*:|\/|[a-zA-Z0-9._~!$&'()*+,;=:@-])/u.test(
        source
      );
    } catch {
      return false;
    }
  }

  private isValidRFC3339(timeString: string): boolean {
    // RFC3339 datetime validation
    const rfc3339Regex =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
    if (!rfc3339Regex.test(timeString)) {
      return false;
    }

    // Validate date is valid
    const date = new Date(timeString);
    return !isNaN(date.getTime());
  }

  private updateProcessingStats(processingTime: number): void {
    this.processingTimes.push(processingTime);

    // Keep last ~1000 processing time records
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-500);
    }

    // Update average processing time
    this.stats.avgProcessingTime =
      this.processingTimes.reduce((sum, time) => sum + time, 0) /
      this.processingTimes.length;
  }

  private updateStats(errors: ValidationError[]): void {
    this.stats.totalEvents++;

    if (errors.filter(e => e.severity === 'error').length === 0) {
      this.stats.validEvents++;
    } else {
      this.stats.invalidEvents++;
    }

    // Update error buckets by code
    for (const error of errors) {
      this.stats.errorsByType[error.code] =
        (this.stats.errorsByType[error.code] || 0) + 1;
    }

    this.stats.lastValidation = new Date().toISOString();
  }
}

// ============================================================================
// Exports (default instance and factories)
// ============================================================================

// Default singleton instance
export const defaultValidator = new CloudEventsValidator();

// Factory method for custom configuration
export function createValidator(
  config?: Partial<ValidationConfig>
): CloudEventsValidator {
  return new CloudEventsValidator(config);
}

// Convenience validation function
export function validateCloudEvent(event: BaseEvent): ValidationResult {
  return defaultValidator.validate(event);
}

// Convenience middleware factory
export function createValidationMiddleware(config?: Partial<ValidationConfig>) {
  const validator = config ? createValidator(config) : defaultValidator;
  return validator.createMiddleware();
}
