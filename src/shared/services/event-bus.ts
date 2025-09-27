/**
 *  - CloudEvents
 *  CH04
 *
 * :
 * - CloudEvents 1.0/
 * -
 * -
 * -
 */

import { EventEmitter } from 'events';
import type {
  DomainEvent,
  BaseEvent,
  EventPublisher,
  EventSubscriber,
  EventMiddleware,
} from '../contracts/events';
import {
  createValidationMiddleware,
  type ValidationConfig,
} from '../middleware/cloud-events-validator';

// ============================================================================
//
// ============================================================================

export interface EventBusConfig {
  /** CloudEvents */
  validation?: Partial<ValidationConfig>;
  /**  */
  enableMiddleware: boolean;
  /**  */
  maxListeners: number;
  /**  */
  enableDebugLogging: boolean;
}

const DEFAULT_CONFIG: EventBusConfig = {
  validation: {
    level: (process.env.CLOUDEVENTS_VALIDATION_LEVEL as any) || 'strict',
    enablePerformanceMonitoring: process.env.NODE_ENV !== 'production',
  },
  enableMiddleware: true,
  maxListeners: Number(process.env.EVENT_BUS_MAX_LISTENERS || '100'),
  enableDebugLogging: process.env.DEBUG_EVENTS === 'true',
};

// ============================================================================
//
// ============================================================================

export class EventBus implements EventPublisher, EventSubscriber {
  private emitter: EventEmitter;
  private middlewares: EventMiddleware[] = [];
  private config: EventBusConfig;
  private publishCount = 0;
  private subscriptionCount = 0;
  // handlerwrapped handler,unsubscribe
  private handlerMap = new Map<
    string,
    Map<(...args: any[]) => void, (...args: any[]) => void>
  >();

  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(this.config.maxListeners);

    // CloudEvents
    if (this.config.enableMiddleware) {
      this.addMiddleware(createValidationMiddleware(this.config.validation));
    }

    this.setupErrorHandling();
  }

  // ============================================================================
  // API
  // ============================================================================

  /**
   *
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    try {
      //
      let processedEvent = event as BaseEvent;
      for (const middleware of this.middlewares) {
        processedEvent = middleware(processedEvent);
      }

      //
      if (this.config.enableDebugLogging) {
        console.debug(`📤 Publishing event: ${event.type}`, {
          id: event.id,
          source: event.source,
          timestamp: event.time,
        });
      }

      //
      this.emitter.emit(event.type, processedEvent);
      this.emitter.emit('*', processedEvent); //

      this.publishCount++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (this.config.enableDebugLogging) {
        console.error(
          `❌ Failed to publish event ${event.type}:`,
          errorMessage
        );
      }

      //
      this.emitter.emit('error', {
        event,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   *
   */
  async subscribe<T extends DomainEvent>(
    eventType: T['type'],
    handler: (event: T) => Promise<void>
  ): Promise<void> {
    const wrappedHandler = async (event: T) => {
      try {
        if (this.config.enableDebugLogging) {
          console.debug(`📥 Handling event: ${eventType}`, {
            id: event.id,
            source: event.source,
          });
        }

        await handler(event);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(`❌ Event handler error for ${eventType}:`, errorMessage);

        //
        this.emitter.emit('handler-error', {
          eventType,
          event,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // handlerwrapped handler
    if (!this.handlerMap.has(eventType)) {
      this.handlerMap.set(eventType, new Map());
    }
    this.handlerMap.get(eventType)!.set(handler, wrappedHandler);

    this.emitter.on(eventType, wrappedHandler);
    this.subscriptionCount++;

    if (this.config.enableDebugLogging) {
      console.debug(
        `🔔 Subscribed to event: ${eventType} (total subscriptions: ${this.subscriptionCount})`
      );
    }
  }

  /**
   * ()
   */
  async subscribeAll(
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<void> {
    await this.subscribe('*' as any, handler);
  }

  /**
   *
   */
  unsubscribe(eventType: string, handler: (...args: any[]) => void): void {
    // wrapped handler
    const eventHandlers = this.handlerMap.get(eventType);
    if (eventHandlers && eventHandlers.has(handler)) {
      const wrappedHandler = eventHandlers.get(handler)!;
      this.emitter.off(eventType, wrappedHandler);
      eventHandlers.delete(handler);

      // handler,
      if (eventHandlers.size === 0) {
        this.handlerMap.delete(eventType);
      }
    } else {
      // handler()
      this.emitter.off(eventType, handler);
    }

    this.subscriptionCount = Math.max(0, this.subscriptionCount - 1);

    if (this.config.enableDebugLogging) {
      console.debug(`🔕 Unsubscribed from event: ${eventType}`);
    }
  }

  /**
   *
   */
  addMiddleware(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   *
   */
  removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middlewares.indexOf(middleware);
    if (index > -1) {
      this.middlewares.splice(index, 1);
    }
  }

  /**
   *
   */
  clearMiddlewares(): void {
    this.middlewares = [];
  }

  /**
   *
   */
  getStats() {
    return {
      publishCount: this.publishCount,
      subscriptionCount: this.subscriptionCount,
      middlewareCount: this.middlewares.length,
      maxListeners: this.emitter.getMaxListeners(),
      eventNames: this.emitter.eventNames(),
    };
  }

  /**
   * ()
   */
  getEmitterForTesting(): EventEmitter {
    return this.emitter;
  }

  /**
   *
   */
  destroy(): void {
    this.emitter.removeAllListeners();
    this.middlewares = [];
    this.handlerMap.clear();
    this.publishCount = 0;
    this.subscriptionCount = 0;

    if (this.config.enableDebugLogging) {
      console.debug('🔥 EventBus destroyed');
    }
  }

  // ============================================================================
  //
  // ============================================================================

  private setupErrorHandling(): void {
    //
    this.emitter.on('error', errorInfo => {
      console.error('💥 EventBus error:', errorInfo);
    });

    //
    this.emitter.on('handler-error', errorInfo => {
      console.warn('⚠️  Event handler error:', errorInfo);
    });

    //
    if (this.config.enableDebugLogging && typeof process !== 'undefined') {
      setInterval(() => {
        const listenerCount = this.emitter
          .eventNames()
          .reduce(
            (total, eventName) => total + this.emitter.listenerCount(eventName),
            0
          );

        if (listenerCount > this.config.maxListeners * 0.8) {
          console.warn(
            `⚠️  EventBus approaching listener limit: ${listenerCount}/${this.config.maxListeners}`
          );
        }
      }, 30000); // 30
    }
  }
}

// ============================================================================
//
// ============================================================================

//
export const eventBus = new EventBus();

//
export function createEventBus(config?: Partial<EventBusConfig>): EventBus {
  return new EventBus(config);
}

//
export async function publishEvent<T extends DomainEvent>(
  event: T
): Promise<void> {
  return eventBus.publish(event);
}

//
export async function subscribeToEvent<T extends DomainEvent>(
  eventType: T['type'],
  handler: (event: T) => Promise<void>
): Promise<void> {
  return eventBus.subscribe(eventType, handler);
}
