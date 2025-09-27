import { describe, it, expect, vi } from 'vitest';
import type { AppEvent } from '../../src/core/events/types';
import type { EventHandler } from '../../src/shared/contracts/events/index';
import { InMemoryEventBus } from '../../src/core/events/bus';

describe('Event Bus contracts', () => {
  it('event type should follow <domain>.<action>', async () => {
    const bus = new InMemoryEventBus();
    await expect(
      bus.publish({ type: 'guild.create', name: 'A' } as AppEvent)
    ).resolves.not.toThrow();
    await expect(
      bus.publish({ type: 'invalid', name: 'A' } as unknown as AppEvent)
    ).rejects.toThrow();
  });

  it('multiple subscribers receive events in FIFO order', async () => {
    const bus = new InMemoryEventBus();
    const order: string[] = [];
    const a = vi.fn((e: AppEvent) => order.push('a:' + e.type));
    const b = vi.fn((e: AppEvent) => order.push('b:' + e.type));

    const ah: EventHandler<AppEvent> = e => a(e);
    const bh: EventHandler<AppEvent> = e => b(e);
    bus.subscribe('guild.create', ah);
    bus.subscribe('guild.create', bh);
    bus.subscribe('inventory.add', vi.fn()); // irrelevant topic

    await bus.publish({ type: 'guild.create', name: 'A' } as AppEvent);

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['a:guild.create', 'b:guild.create']);
  });

  it('unsubscribe detaches handler', async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();
    const sub = bus.subscribe('guild.create', (e: AppEvent) => handler(e));
    sub.unsubscribe();
    await bus.publish({ type: 'guild.create', name: 'X' } as AppEvent);
    expect(handler).not.toHaveBeenCalled();
  });
});
