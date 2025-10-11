/** EventBus for React <-> Phaser domain events (clean implementation). */

import type {
  GameDomainEvent,
  GameEventHandler,
  EnhancedGameEvent,
  GameEventMetadata,
} from '../contracts/events/GameEvents';
import { EventPriority } from '../contracts/events/GameEvents';

export interface EventSubscription {
  id: string;
  handler: GameEventHandler;
  priority: EventPriority;
  once?: boolean;
  context?: string;
}

export interface EventBusOptions {
  maxListeners?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  queueSize?: number;
}

export class EventBus {
  private listeners: Map<string, EventSubscription[]> = new Map();
  private eventQueue: EnhancedGameEvent[] = [];
  private isProcessing = false;
  private subscriptionIdCounter = 0;
  private options: Required<EventBusOptions>;

  private metrics = {
    eventsPublished: 0,
    eventsProcessed: 0,
    averageProcessingTime: 0,
    lastEventTime: 0,
  };

  constructor(options: EventBusOptions = {}) {
    this.options = {
      maxListeners: options.maxListeners ?? 100,
      enableLogging:
        options.enableLogging ?? process.env.NODE_ENV === 'development',
      enableMetrics: options.enableMetrics ?? true,
      queueSize: options.queueSize ?? 1000,
    };
  }

  public subscribe<T extends GameDomainEvent>(
    eventType: T['type'],
    handler: GameEventHandler<T>,
    options: { priority?: EventPriority; once?: boolean; context?: string } = {}
  ): string {
    const subscriptionId = `sub_${++this.subscriptionIdCounter}`;

    const list = this.listeners.get(eventType) ?? [];
    if (list.length >= this.options.maxListeners) {
      throw new Error(
        `Maximum listeners (${this.options.maxListeners}) exceeded for event: ${eventType}`
      );
    }
    const sub: EventSubscription = {
      id: subscriptionId,
      handler: handler as GameEventHandler,
      priority: options.priority ?? EventPriority.NORMAL,
      once: options.once ?? false,
      context: options.context,
    };
    list.push(sub);
    list.sort((a, b) => b.priority - a.priority);
    this.listeners.set(eventType, list);

    if (this.options.enableLogging) {
      console.log(
        `[EventBus] Subscribed to ${eventType} (ID: ${subscriptionId}, Context: ${options.context || 'unknown'})`
      );
    }
    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subs] of this.listeners.entries()) {
      const idx = subs.findIndex(s => s.id === subscriptionId);
      if (idx !== -1) {
        subs.splice(idx, 1);
        if (subs.length === 0) this.listeners.delete(eventType);
        if (this.options.enableLogging) {
          console.log(
            `[EventBus] Unsubscribed from ${eventType} (ID: ${subscriptionId})`
          );
        }
        return true;
      }
    }
    return false;
  }

  public unsubscribeAll(eventType: GameDomainEvent['type']): number {
    const subs = this.listeners.get(eventType);
    if (!subs) return 0;
    const count = subs.length;
    this.listeners.delete(eventType);
    if (this.options.enableLogging) {
      console.log(
        `[EventBus] Unsubscribed all (${count}) listeners from ${eventType}`
      );
    }
    return count;
  }

  public publish(event: GameDomainEvent, metadata?: Partial<GameEventMetadata>): void {
    const enhanced: EnhancedGameEvent = {
      ...event,
      metadata: {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        timestamp: new Date(),
        source: metadata?.source || 'unknown',
        priority: metadata?.priority ?? EventPriority.NORMAL,
        persistent: metadata?.persistent ?? false,
        broadcast: metadata?.broadcast ?? true,
        ...metadata,
      },
    };
    this.metrics.eventsPublished++;
    if (this.options.enableLogging) {
      console.log(`[EventBus] Publishing event: ${event.type}`, enhanced);
    }
    this.processEvent(enhanced);
  }

  public async publishAsync(
    event: GameDomainEvent,
    metadata?: Partial<GameEventMetadata>
  ): Promise<void> {
    const enhanced: EnhancedGameEvent = {
      ...event,
      metadata: {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        timestamp: new Date(),
        source: metadata?.source || 'unknown',
        priority: metadata?.priority ?? EventPriority.NORMAL,
        persistent: metadata?.persistent ?? false,
        broadcast: metadata?.broadcast ?? true,
        ...metadata,
      },
    };
    if (this.eventQueue.length >= this.options.queueSize) {
      console.warn(
        `[EventBus] Event queue full (${this.options.queueSize}), dropping oldest event`
      );
      this.eventQueue.shift();
    }
    this.eventQueue.push(enhanced);
    this.metrics.eventsPublished++;
    if (!this.isProcessing) await this.processEventQueue();
  }

  private processEvent(event: EnhancedGameEvent): void {
    const start = performance.now();
    const subs = this.listeners.get((event as any).type) || [];
    if (subs.length === 0) {
      if (this.options.enableLogging) {
        console.warn(`[EventBus] No listeners for event: ${(event as any).type}`);
      }
      return;
    }

    const toRemove: string[] = [];
    for (const sub of subs) {
      try {
        const result = sub.handler(event as any);
        if (result && typeof (result as any).then === 'function') {
          (result as Promise<unknown>).catch(err =>
            console.error(`[EventBus] Async handler error for ${(event as any).type}:`, err)
          );
        }
        if (sub.once) toRemove.push(sub.id);
      } catch (err) {
        console.error(`[EventBus] Handler error for ${(event as any).type}:`, err);
        throw err;
      }
    }
    toRemove.forEach(id => this.unsubscribe(id));

    if (this.options.enableMetrics) {
      const dt = performance.now() - start;
      this.metrics.eventsProcessed++;
      this.metrics.averageProcessingTime =
        (this.metrics.averageProcessingTime * (this.metrics.eventsProcessed - 1) + dt) /
        this.metrics.eventsProcessed;
      this.metrics.lastEventTime = Date.now();
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      while (this.eventQueue.length > 0) {
        const evt = this.eventQueue.shift()!;
        this.processEvent(evt);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public getListenerStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [type, subs] of this.listeners.entries()) stats[type] = subs.length;
    return stats;
  }

  public getMetrics() {
    return { ...this.metrics };
  }

  public destroy(): void {
    this.listeners.clear();
    this.eventQueue.length = 0;
    this.isProcessing = false;
    if (this.options.enableLogging) console.log('[EventBus] EventBus destroyed');
  }

  public hasListeners(eventType: GameDomainEvent['type']): boolean {
    const subs = this.listeners.get(eventType);
    return subs ? subs.length > 0 : false;
  }

  public getListenerCount(eventType: GameDomainEvent['type']): number {
    const subs = this.listeners.get(eventType);
    return subs ? subs.length : 0;
  }
}
