/**
 * CloudEvents real-time validation middleware
 * Provides runtime validation and monitoring capabilities
 */

import type { CloudEvent } from '../contracts/cloudevents-core.js';
import { assertCe, isCloudEvent } from '../contracts/cloudevents-core.js';

export interface ValidationError {
  timestamp: string;
  error: string;
  originalEvent?: unknown;
  context?: string;
}

export interface ValidationStats {
  totalValidated: number;
  totalErrors: number;
  errorRate: number;
  lastError?: ValidationError;
}

/**
 * CloudEvents validator singleton
 * - Validates CloudEvent shape at runtime
 * - Tracks stats and recent errors
 * - Exposes helpers, middleware and decorators
 */
export class CloudEventsValidator {
  private static instance: CloudEventsValidator;
  private errors: ValidationError[] = [];
  private stats: ValidationStats = {
    totalValidated: 0,
    totalErrors: 0,
    errorRate: 0,
  };

  //
  private errorListeners: Array<(error: ValidationError) => void> = [];

  //
  private config = {
    maxErrorHistory: 100,
    enableLogging: true,
    strictMode: false, //
    enableMetrics: true,
  };

  static getInstance(): CloudEventsValidator {
    if (!CloudEventsValidator.instance) {
      CloudEventsValidator.instance = new CloudEventsValidator();
    }
    return CloudEventsValidator.instance;
  }

  /**
   * Update validator configuration (shallow merge)
   */
  configure(options: Partial<typeof this.config>) {
    this.config = { ...this.config, ...options };
  }

  /**
   * Read-only snapshot of current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Validate a single event
   * Returns true when the event conforms to CloudEvents spec
   */
  validate(event: unknown, context?: string): event is CloudEvent {
    this.stats.totalValidated++;

    try {
      assertCe(event);
      return true;
    } catch (error) {
      const validationError: ValidationError = {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        originalEvent: event,
        context,
      };

      this.recordError(validationError);

      if (this.config.strictMode) {
        throw error;
      }

      return false;
    }
  }

  /**
   * Validate a batch of events and collect results
   */
  validateBatch(
    events: unknown[],
    context?: string
  ): {
    valid: CloudEvent[];
    invalid: Array<{ event: unknown; error: string; index: number }>;
  } {
    const valid: CloudEvent[] = [];
    const invalid: Array<{ event: unknown; error: string; index: number }> = [];

    events.forEach((event, index) => {
      try {
        if (this.validate(event, `${context}[${index}]`)) {
          valid.push(event as CloudEvent);
        } else {
          invalid.push({
            event,
            error: 'Validation failed',
            index,
          });
        }
      } catch (error) {
        invalid.push({
          event,
          error: error instanceof Error ? error.message : String(error),
          index,
        });
      }
    });

    return { valid, invalid };
  }

  /**
   * Minimal middleware to gate invalid events
   */
  middleware() {
    return (event: unknown, next: (validEvent: CloudEvent) => void) => {
      if (this.validate(event, 'middleware')) {
        next(event as CloudEvent);
      } else {
        if (this.config.enableLogging) {
          console.warn(
            '[CloudEvents] Invalid event blocked by middleware:',
            event
          );
        }
      }
    };
  }

  /**
   * Method decorator to validate the first argument as CloudEvent
   */
  validateEvent(context?: string) {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      // :descriptorvalue
      if (!descriptor || typeof descriptor.value !== 'function') {
        console.warn(
          `[CloudEvents] Cannot apply validateEvent decorator to ${propertyKey}: descriptor.value is not a function`
        );
        return descriptor;
      }

      const originalMethod = descriptor.value;

      descriptor.value = function (...args: any[]) {
        //
        if (args.length > 0) {
          const validator = CloudEventsValidator.getInstance();
          if (
            !validator.validate(
              args[0],
              `${target.constructor.name}.${propertyKey}`
            )
          ) {
            if (validator.config.enableLogging) {
              console.warn(
                `[CloudEvents] Method ${propertyKey} received invalid event:`,
                args[0]
              );
            }
            if (validator.config.strictMode) {
              return;
            }
          }
        }

        return originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }

  /**
   * Express.js
   */
  expressMiddleware() {
    return (req: any, res: any, next: any) => {
      if (
        req.body &&
        req.headers['content-type']?.includes('application/cloudevents+json')
      ) {
        if (!this.validate(req.body, 'express-middleware')) {
          return res.status(400).json({
            error: 'Invalid CloudEvents format',
            details: this.getLastError(),
          });
        }
      }
      next();
    };
  }

  /**
   * Record a validation error, update stats, and notify listeners
   */
  private recordError(error: ValidationError) {
    this.stats.totalErrors++;
    this.stats.errorRate = this.stats.totalErrors / this.stats.totalValidated;
    this.stats.lastError = error;

    this.errors.push(error);
    if (this.errors.length > this.config.maxErrorHistory) {
      this.errors.shift();
    }

    //
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('[CloudEvents] Error in error listener:', e);
      }
    });

    if (this.config.enableLogging) {
      console.error('[CloudEvents] Validation error:', error);
    }
  }

  /**
   * Subscribe to validation errors; returns an unsubscribe function
   */
  onError(listener: (error: ValidationError) => void) {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get a snapshot of current statistics
   */
  getStats(): ValidationStats {
    return { ...this.stats };
  }

  /**
   * Get a copy of recorded validation errors
   */
  getErrors(): ValidationError[] {
    return [...this.errors];
  }

  /**
   * Get the last validation error, if any
   */
  getLastError(): ValidationError | undefined {
    return this.stats.lastError;
  }

  /**
   * Clear recorded errors and reset related stats
   */
  clearErrors() {
    this.errors = [];
    this.stats.totalErrors = 0;
    this.stats.errorRate = this.stats.totalValidated > 0 ? 0 : 0;
    this.stats.lastError = undefined;
  }

  /**
   * Reset all statistics and clear errors
   */
  resetStats() {
    this.stats = {
      totalValidated: 0,
      totalErrors: 0,
      errorRate: 0,
    };
    this.clearErrors();
  }

  /**
   * Generate a simple operational report with recommendations
   */
  generateReport(): {
    stats: ValidationStats;
    recentErrors: ValidationError[];
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (this.stats.errorRate > 0.1) {
      recommendations.push(
        'High error rate > 10%; review producers and consider strictMode'
      );
    }

    if (this.stats.totalErrors > 0) {
      const errorTypes = new Map<string, number>();
      this.errors.forEach(error => {
        const type = error.error.split(':')[0];
        errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
      });

      const mostCommonError = Array.from(errorTypes.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0];

      if (mostCommonError) {
        recommendations.push(
          `Most common error: ${mostCommonError[0]} (${mostCommonError[1]})`
        );
      }
    }

    return {
      stats: this.getStats(),
      recentErrors: this.getErrors().slice(-10),
      recommendations,
    };
  }

  /**
   * Start periodic monitoring; returns a function to stop it
   */
  startMonitoring(options?: {
    intervalMs?: number;
    logStats?: boolean;
    alertThreshold?: number;
  }) {
    const config = {
      intervalMs: 60000, // 1 minute
      logStats: false,
      alertThreshold: 0.05, // 5%
      ...options,
    };

    const interval = setInterval(() => {
      const stats = this.getStats();

      if (config.logStats) {
        console.log('[CloudEvents] Monitoring stats:', stats);
      }

      if (
        stats.errorRate > config.alertThreshold &&
        stats.totalValidated > 10
      ) {
        console.warn(
          `[CloudEvents] Error rate exceeded threshold: ${(stats.errorRate * 100).toFixed(2)}% > ${(config.alertThreshold * 100).toFixed(2)}%`
        );
      }
    }, config.intervalMs);

    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const cloudEventsValidator = CloudEventsValidator.getInstance();

// Convenience global helpers
export const validateEvent = (event: unknown, context?: string) =>
  cloudEventsValidator.validate(event, context);

export const validateEvents = (events: unknown[], context?: string) =>
  cloudEventsValidator.validateBatch(events, context);

import React from 'react';

/**
 * React Hook for CloudEvents validation
 * @returns {{
 * stats: ValidationStats,
 * errors: ValidationError[],
 * validate: (event: unknown, context?: string) => boolean,
 * validateBatch: (events: unknown[], context?: string) => { valid: CloudEvent[]; invalid: Array<{ event: unknown; error: string; index: number }>},
 * clearErrors: () => void
 * }}
 */
export function useCloudEventsValidation() {
  const [stats, setStats] = React.useState<ValidationStats>(
    cloudEventsValidator.getStats()
  );
  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  React.useEffect(() => {
    const updateStats = () => {
      setStats(cloudEventsValidator.getStats());
      // Last 5 errors
      setErrors(cloudEventsValidator.getErrors().slice(-5));
    };

    // Listen for errors
    const unsubscribe = cloudEventsValidator.onError(updateStats);

    // Periodic updates
    const interval = setInterval(updateStats, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    stats,
    errors,
    validate: cloudEventsValidator.validate.bind(cloudEventsValidator),
    validateBatch:
      cloudEventsValidator.validateBatch.bind(cloudEventsValidator),
    clearErrors: cloudEventsValidator.clearErrors.bind(cloudEventsValidator),
  };
}

/**
 * Electron IPC validation middleware
 * @returns {{
 * mainProcess: (ipcMain: any) => void,
 * rendererProcess: (ipcRenderer: any) => void
 * }}
 */
export function createIPCValidationMiddleware() {
  return {
    // Main process validation
    mainProcess: (ipcMain: any) => {
      const originalHandle = ipcMain.handle.bind(ipcMain);

      ipcMain.handle = (
        channel: string,
        listener: (event: any, ...args: any[]) => any
      ) => {
        if (channel.includes('cloudevents')) {
          const wrappedListener = (event: any, ...args: any[]) => {
            // Validate the first argument if it is a CloudEvent
            if (args.length > 0 && typeof args[0] === 'object') {
              if (!cloudEventsValidator.validate(args[0], `ipc:${channel}`)) {
                throw new Error(
                  `Invalid CloudEvent received on channel ${channel}`
                );
              }
            }
            return listener(event, ...args);
          };
          return originalHandle(channel, wrappedListener);
        }
        return originalHandle(channel, listener);
      };
    },

    //
    rendererProcess: (ipcRenderer: any) => {
      const originalInvoke = ipcRenderer.invoke.bind(ipcRenderer);

      ipcRenderer.invoke = (channel: string, ...args: any[]) => {
        if (channel.includes('cloudevents') && args.length > 0) {
          if (
            !cloudEventsValidator.validate(args[0], `ipc-renderer:${channel}`)
          ) {
            return Promise.reject(
              new Error(`Invalid CloudEvent sent on channel ${channel}`)
            );
          }
        }
        return originalInvoke(channel, ...args);
      };
    },
  };
}

/**
 *
 */
/**
 * Event bus validator wrapper
 * @param eventBus A simple EventEmitter-like object with on/emit
 * @returns a proxied eventBus with CloudEvents validation on emit
 *
 * References: ADR-0004 (event bus and contracts)
 */
export function createEventBusValidator<
  T extends { on: Function; emit: Function },
>(eventBus: T): T {
  const originalEmit = eventBus.emit.bind(eventBus);

  (eventBus as any).emit = (eventName: string, event: unknown) => {
    if (eventName.startsWith('cloudevent:') || isCloudEvent(event)) {
      if (!cloudEventsValidator.validate(event, `eventbus:${eventName}`)) {
        const config = cloudEventsValidator.getConfig();
        if (config.enableLogging) {
          console.warn(
            `[CloudEvents] Invalid event blocked on ${eventName}:`,
            event
          );
        }
        if (config.strictMode) {
          throw new Error(`Invalid CloudEvent emitted on ${eventName}`);
        }
        return;
      }
    }

    return originalEmit(eventName, event);
  };

  return eventBus;
}
