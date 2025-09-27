/**
 *
 * CloudEvents 1.0
 */

/**
 *  - CloudEvents v1.0
 */
export interface BaseEvent {
  // CloudEvents v1.0
  specversion: '1.0';
  type: string;
  source: string;
  id: string;

  // CloudEvents v1.0
  time?: string; // RFC3339,
  datacontenttype?: string;
  dataschema?: string;
  subject?: string;
  data?: unknown;

  // (CloudEvents)
  [key: string]: any;
}

/**
 *  -
 */
export interface GameEvent extends BaseEvent {
  type: string; //
  source: string; // source
}

/**
 * UI
 */
export interface UIEvent extends BaseEvent {
  type: string; //
  source: string; // source
}

/**
 *
 */
export interface SystemEvent extends BaseEvent {
  type: string; //
  source: string; // source
}

/**
 *  - Electron
 * ADR-0004
 */
export interface SecurityGlobalInitEvent extends BaseEvent {
  type: 'security.global.init';
  source: 'app://main';
  data: {
    readyAt: string;
    handlers: Array<
      'permissionCheck' | 'permissionRequest' | 'headers' | 'beforeRequest'
    >;
  };
}

/**
 *
 */
export type DomainEvent =
  | GameEvent
  | UIEvent
  | SystemEvent
  | SecurityGlobalInitEvent;

/**
 *
 */
export interface EventPublisher {
  publish<T extends DomainEvent>(event: T): Promise<void>;
}

/**
 *
 */
export type EventMiddleware = (event: BaseEvent) => BaseEvent;

/**
 *
 */
export interface EventSubscriber {
  subscribe<T extends DomainEvent>(
    eventType: T['type'],
    handler: (event: T) => Promise<void>
  ): Promise<void>;
}

/**
 *
 */
export type EventName = string;

/**
 *
 */
export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 *
 */
export type EventSource = string;

/**
 *
 */
export interface EventBusMetrics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  avgProcessingTime: number;
}

/**
 *
 */
export interface BatchResult {
  processed: number;
  failed: number;
  errors: Error[];
}

/**
 *
 */
export interface EventSubscription {
  id: string;
  eventType: string;
  handler: Function;
}

/**
 *
 */
export interface BatchConfig {
  batchSize: number;
  maxBatchSize: number; // maxBatchSize
  flushInterval: number;
  priorityThresholds: Record<EventPriority, number>;
}

/**
 *
 */
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 100,
  maxBatchSize: 50, //
  flushInterval: 16, // 16ms (60fps)
  priorityThresholds: {
    critical: 0,
    high: 1, //
    medium: 16, //
    low: 100, //
  },
};

/**
 *
 */
export class EventUtils {
  /**
   *
   */
  static isValidEventName(name: string): boolean {
    const pattern = /^[a-z][a-z0-9]*\.[a-z][a-z0-9]*\.[a-z][a-z0-9]*$/;
    return pattern.test(name) && !name.includes('..');
  }

  /**
   *
   */
  static matchesPattern(eventName: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '[^.]*').replace(/\*\*/g, '.*');
    return new RegExp(`^${regexPattern}$`).test(eventName);
  }

  /**
   *
   */
  static inferPriority(eventType: string): EventPriority {
    // medium,
    return 'medium';
  }

  /**
   *  - CloudEvents v1.0,
   */
  static createEvent<T extends DomainEvent>(options: {
    type: string;
    source: string;
    data?: any;
    id?: string;
    time?: string;
    subject?: string;
    datacontenttype?: string;
    dataschema?: string;
    [key: string]: any;
  }): T;
  static createEvent<T extends DomainEvent>(
    type: string,
    source: string,
    data?: any,
    options?: {
      id?: string;
      time?: string;
      subject?: string;
      datacontenttype?: string;
      dataschema?: string;
      priority?: EventPriority;
      traceId?: string;
      sequenceId?: number;
      [key: string]: any;
    }
  ): T;
  static createEvent<T extends DomainEvent>(
    typeOrOptions:
      | string
      | {
          type: string;
          source: string;
          data?: any;
          id?: string;
          time?: string;
          subject?: string;
          datacontenttype?: string;
          dataschema?: string;
          [key: string]: any;
        },
    source?: string,
    data?: any,
    options?: {
      id?: string;
      time?: string;
      subject?: string;
      datacontenttype?: string;
      dataschema?: string;
      priority?: EventPriority;
      traceId?: string;
      sequenceId?: number;
      [key: string]: any;
    }
  ): T {
    //
    if (typeof typeOrOptions === 'object') {
      //
      const opts = typeOrOptions;
      const event: BaseEvent = {
        // CloudEvents v1.0
        specversion: '1.0',
        type: opts.type,
        source: opts.source,
        id: opts.id || crypto.randomUUID(),

        // CloudEvents v1.0  - time
        time: opts.time || new Date().toISOString(),
        ...(opts.subject && { subject: opts.subject }),
        datacontenttype: opts.datacontenttype || 'application/json', //
        ...(opts.dataschema && { dataschema: opts.dataschema }),
        ...(opts.data !== undefined && { data: opts.data }),
      };

      //
      Object.keys(opts).forEach(key => {
        if (
          ![
            'type',
            'source',
            'id',
            'time',
            'subject',
            'datacontenttype',
            'dataschema',
            'data',
          ].includes(key)
        ) {
          event[key] = opts[key];
        }
      });

      return event as T;
    }
    //  -
    const type = typeOrOptions;
    const eventOptions = options || {};
    const event: BaseEvent = {
      // CloudEvents v1.0
      specversion: '1.0',
      type,
      source: source!,
      id: eventOptions.id || crypto.randomUUID(),

      // CloudEvents v1.0  - time
      time: eventOptions.time || new Date().toISOString(),
      ...(eventOptions.subject && { subject: eventOptions.subject }),
      datacontenttype: eventOptions.datacontenttype || 'application/json', //
      ...(eventOptions.dataschema && { dataschema: eventOptions.dataschema }),
      ...(data !== undefined && { data }),
    };

    // (CloudEvents v1.0,)
    event.priority = eventOptions.priority || 'medium';
    event.sequenceId = eventOptions.sequenceId || 0;
    event.timestamp = Date.now(); // ,ISO
    if (eventOptions.traceId) {
      event.traceId = eventOptions.traceId;
    }

    //
    Object.keys(eventOptions).forEach(key => {
      if (
        ![
          'id',
          'time',
          'subject',
          'datacontenttype',
          'dataschema',
          'priority',
          'sequenceId',
          'traceId',
        ].includes(key)
      ) {
        event[key] = eventOptions[key];
      }
    });

    return event as T;
  }
}

/**
 *
 */
export class EventPatterns {
  static readonly GAME_EVENTS = 'game.**';
  static readonly UI_EVENTS = 'ui.**';
  static readonly SYSTEM_EVENTS = 'system.**';
  static readonly ERROR_EVENTS = '**.error.**';
}

/**
 *
 */
export class PriorityMapping {
  static readonly priorityThresholds = DEFAULT_BATCH_CONFIG.priorityThresholds;
}

/**
 *
 */
export class EventBusError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'EventBusError';
  }
}

/**
 *
 */
export class CircuitBreakerOpenError extends EventBusError {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 *
 */
export class BackpressureError extends EventBusError {
  constructor(message: string) {
    super(message);
    this.name = 'BackpressureError';
  }
}
