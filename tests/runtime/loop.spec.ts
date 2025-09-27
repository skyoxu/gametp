import { describe, it, expect, vi } from 'vitest';
import { GameLoop } from '../../src/runtime/loop';
import { StateMachine } from '../../src/runtime/state';

describe('06 \u8fd0\u884c\u65f6\u89c6\u56fe', () => {
  it('GameLoop \u4ee5\u8fd1\u4f3c 60fps \u9a71\u52a8 update', async () => {
    const update = vi.fn();
    const loop = new GameLoop(update);
    loop.start();
    await new Promise(r => setTimeout(r, 50));
    loop.stop();
    expect(update).toHaveBeenCalled();
  });

  it('\u5f02\u5e38\u88ab\u6355\u83b7\u5e76\u4e0d\u5d29\u6e83\u5faa\u73af', async () => {
    const onError = vi.fn();
    const loop = new GameLoop(() => {
      throw new Error('boom');
    }, onError);
    loop.start();
    await new Promise(r => setTimeout(r, 20));
    loop.stop();
    expect(onError).toHaveBeenCalled();
  });

  it('\u72b6\u6001\u673a\u5408\u6cd5\u8fc1\u79fb', () => {
    const sm = new StateMachine();
    sm.transition('loading');
    sm.transition('running');
    sm.transition('paused');
    sm.transition('running');
    expect(sm.current).toBe('running');
  });
});
