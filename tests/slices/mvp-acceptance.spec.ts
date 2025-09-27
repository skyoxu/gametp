import { describe, it, expect } from 'vitest';
import { createGuildFlow } from '../../src/slices/mvp/flow';

describe('08 MVP \u7eb5\u5207', () => {
  it('\u521b\u5efa\u516c\u4f1a', async () => {
    const g = await createGuildFlow('Alpha');
    expect(g.name).toBe('Alpha');
    expect(g.id).toBeTruthy();
  });
});
