/*
 * InMemoryEventBus tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryEventBus } from './bus';
import type { EventBus } from './bus';
import type { AppEvent, EventHandler } from './types';

describe('InMemoryEventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
  });

  describe('publish', () => {
    it('publishes a valid event without throwing', async () => {
      const event: AppEvent = { type: 'guild.create', name: 'Test Guild' };

      await expect(eventBus.publish(event)).resolves.not.toThrow();
    });

    it('rejects invalid event type format (no dot)', async () => {
      const invalidEvent = { type: 'invalid_format', name: 'Test' } as any;

      await expect(eventBus.publish(invalidEvent)).rejects.toThrow(
        'Invalid event type: invalid_format'
      );
    });

    it('rejects empty event type', async () => {
      const emptyEvent = { type: '', name: 'Test' } as any;

      await expect(eventBus.publish(emptyEvent)).rejects.toThrow(
        'Invalid event type: '
      );
    });

    it('rejects single-segment event type', async () => {
      const singleEvent = { type: 'guild', name: 'Test' } as any;

      await expect(eventBus.publish(singleEvent)).rejects.toThrow(
        'Invalid event type: guild'
      );
    });
  });

  describe('subscribe', () => {
    it('returns a subscription with unsubscribe()', () => {
      const handler: EventHandler = vi.fn();

      const subscription = eventBus.subscribe('guild.create', handler);

      expect(subscription).toBeDefined();
      expect(subscription.unsubscribe).toBeTypeOf('function');
    });

    it('invokes all subscribed handlers (fan-out)', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const event: AppEvent = { type: 'guild.create', name: 'Test Guild' };

      eventBus.subscribe('guild.create', handler1);
      eventBus.subscribe('guild.create', handler2);

      await eventBus.publish(event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('preserves FIFO ordering for multiple handlers', async () => {
      const callOrder: number[] = [];
      const handler1 = vi.fn(() => callOrder.push(1));
      const handler2 = vi.fn(() => callOrder.push(2));
      const handler3 = vi.fn(() => callOrder.push(3));
      const event: AppEvent = { type: 'guild.create', name: 'Test Guild' };

      eventBus.subscribe('guild.create', handler1);
      eventBus.subscribe('guild.create', handler2);
      eventBus.subscribe('guild.create', handler3);

      await eventBus.publish(event);

      expect(callOrder).toEqual([1, 2, 3]);
    });
  });

  describe('basic flow', () => {
    it('delivers event payload to the subscribed handler', async () => {
      const handler = vi.fn();
      const event: AppEvent = {
        type: 'guild.rename',
        id: 'guild-123',
        name: 'New Name',
      };

      eventBus.subscribe('guild.rename', handler);
      await eventBus.publish(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('supports async handlers', async () => {
      const asyncHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      const event: AppEvent = { type: 'guild.create', name: 'Async Guild' };

      eventBus.subscribe('guild.create', asyncHandler);
      await eventBus.publish(event);

      expect(asyncHandler).toHaveBeenCalledWith(event);
    });

    it('awaits slow async handlers to completion', async () => {
      let completed = false;
      const slowHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        completed = true;
      });
      const event: AppEvent = { type: 'guild.create', name: 'Slow Guild' };

      eventBus.subscribe('guild.create', slowHandler);
      await eventBus.publish(event);

      expect(completed).toBe(true);
    });
  });

  describe(' (unsubscribe)', () => {
    it('', async () => {
      const handler = vi.fn();
      const event: AppEvent = { type: 'guild.create', name: 'Test Guild' };

      const subscription = eventBus.subscribe('guild.create', handler);
      subscription.unsubscribe();

      await eventBus.publish(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const event: AppEvent = { type: 'guild.create', name: 'Test Guild' };

      const subscription1 = eventBus.subscribe('guild.create', handler1);
      eventBus.subscribe('guild.create', handler2);

      subscription1.unsubscribe();
      await eventBus.publish(event);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('', () => {
      const handler = vi.fn();

      const subscription = eventBus.subscribe('guild.create', handler);

      expect(() => {
        subscription.unsubscribe();
        subscription.unsubscribe(); //
      }).not.toThrow();
    });
  });

  describe('clear()', () => {
    it('removes all handlers across event types', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const event1: AppEvent = { type: 'guild.create', name: 'Guild 1' };
      const event2: AppEvent = {
        type: 'inventory.add',
        itemId: 'item-1',
        qty: 5,
      };

      eventBus.subscribe('guild.create', handler1);
      eventBus.subscribe('inventory.add', handler2);

      eventBus.clear();

      await eventBus.publish(event1);
      await eventBus.publish(event2);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('type safety', () => {
    it('routes by event type and not across types', async () => {
      const guildHandler = vi.fn();
      const inventoryHandler = vi.fn();

      eventBus.subscribe('guild.create', guildHandler);
      eventBus.subscribe('inventory.add', inventoryHandler);

      const guildEvent: AppEvent = {
        type: 'guild.create',
        name: 'Type Safe Guild',
      };
      const inventoryEvent: AppEvent = {
        type: 'inventory.add',
        itemId: 'sword',
        qty: 1,
      };

      await eventBus.publish(guildEvent);
      await eventBus.publish(inventoryEvent);

      expect(guildHandler).toHaveBeenCalledWith(guildEvent);
      expect(guildHandler).not.toHaveBeenCalledWith(inventoryEvent);

      expect(inventoryHandler).toHaveBeenCalledWith(inventoryEvent);
      expect(inventoryHandler).not.toHaveBeenCalledWith(guildEvent);
    });
  });

  describe('error handling', () => {
    it('surface sync handler errors', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const event: AppEvent = { type: 'guild.create', name: 'Error Guild' };

      eventBus.subscribe('guild.create', errorHandler);

      await expect(eventBus.publish(event)).rejects.toThrow('Handler error');
    });

    it('surface async handler errors', async () => {
      const asyncErrorHandler = vi.fn(async () => {
        throw new Error('Async handler error');
      });
      const event: AppEvent = {
        type: 'guild.create',
        name: 'Async Error Guild',
      };

      eventBus.subscribe('guild.create', asyncErrorHandler);

      await expect(eventBus.publish(event)).rejects.toThrow(
        'Async handler error'
      );
    });
  });

  describe('performance thresholds', () => {
    const PERF_1000_SUBS_MS = Number(
      process.env.EVTBUS_1000_SUBS_MS || (process.env.CI ? '300' : '100')
    );
    const PERF_100_PUBS_MS = Number(
      process.env.EVTBUS_100_PUBS_MS || (process.env.CI ? '120' : '50')
    );

    it(`processes 1000 subscribers under ${PERF_1000_SUBS_MS} ms`, async () => {
      const handlers = Array.from({ length: 1000 }, () => vi.fn());
      const event: AppEvent = {
        type: 'guild.create',
        name: 'Performance Guild',
      };

      handlers.forEach(handler => {
        eventBus.subscribe('guild.create', handler);
      });

      const startTime = Date.now();
      await eventBus.publish(event);
      const endTime = Date.now();

      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledWith(event);
      });

      expect(endTime - startTime).toBeLessThan(PERF_1000_SUBS_MS);
    });

    it(`publishes 100 events under ${PERF_100_PUBS_MS} ms`, async () => {
      const handler = vi.fn();
      eventBus.subscribe('guild.create', handler);

      const events = Array.from({ length: 100 }, (_, i) => ({
        type: 'guild.create' as const,
        name: `Guild ${i}`,
      }));

      const startTime = Date.now();
      await Promise.all(events.map(event => eventBus.publish(event)));
      const endTime = Date.now();

      expect(handler).toHaveBeenCalledTimes(100);

      expect(endTime - startTime).toBeLessThan(PERF_100_PUBS_MS);
    });
  });
});
