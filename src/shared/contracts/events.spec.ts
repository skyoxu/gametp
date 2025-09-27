/**
 * Event contracts test suite (ASCII-only)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventUtils, DEFAULT_BATCH_CONFIG } from '@/shared/contracts/events';

describe('Event name validation', () => {
  it('accepts valid event names', () => {
    const valid = [
      'domain.entity.created',
      'game.scene.changed',
      'ui.dialog.opened',
      'system.error.occurred',
    ];
    valid.forEach(name => expect(EventUtils.isValidEventName(name)).toBe(true));
  });

  it('rejects invalid event names', () => {
    const invalid = ['invalid', 'missing.action', '.empty.start', 'too.many.parts.here', ''];
    invalid.forEach(name => expect(EventUtils.isValidEventName(name)).toBe(false));
  });
});

describe('Pattern matching', () => {
  it('matches wildcard patterns', () => {
    expect(EventUtils.matchesPattern('game.scene.changed', 'game.*.changed')).toBe(true);
    expect(EventUtils.matchesPattern('ui.dialog.opened', 'ui.*.*')).toBe(true);
    expect(EventUtils.matchesPattern('system.error.occurred', 'game.*.*')).toBe(false);
  });
});

describe('Create event', () => {
  beforeEach(() => {
    if (!globalThis.crypto?.randomUUID) {
      globalThis.crypto = {
        ...globalThis.crypto,
        randomUUID: vi.fn(() => 'test-uuid'),
      } as any;
    }
  });

  it('creates a CloudEvents v1.0 compatible event', () => {
    const payload = { id: '1', name: 'T', ts: Date.now() };
    const ev = EventUtils.createEvent('game.scene.changed', '/phaser/scene', payload, {
      priority: 'critical',
    });
    expect(ev.type).toBe('game.scene.changed');
    expect(ev.source).toBe('/phaser/scene');
    expect(ev.data).toEqual(payload);
    expect(typeof ev.id).toBe('string');
    expect(typeof ev.time).toBe('string');
  });
});

describe('Batch config', () => {
  it('exposes sane default thresholds', () => {
    const p = DEFAULT_BATCH_CONFIG.priorityThresholds;
    expect(p.critical).toBe(0);
    expect(p.high).toBe(1);
    expect(p.medium).toBe(16);
    expect(p.low).toBe(100);
  });
});

