import React, {
  Suspense,
  useCallback,
  useState,
  useTransition,
  useDeferredValue,
} from 'react';

type LazyGameProps = {
  sceneModule?: string; // e.g. '@/game/scenes/MainScene'
  onLoaded?: () => void;
};

export default function LazyGame({
  sceneModule = '@/game/scenes/MainScene',
  onLoaded,
}: LazyGameProps) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredMounted = useDeferredValue(mounted);

  const onStart = useCallback(async () => {
    if (mounted || loading) return;
    setLoading(true);
    // Phaser
    const [{ loadPhaserAndScene }] = await Promise.all([
      import('@/game/lazy/phaser-loader'),
      new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))),
    ]);
    await loadPhaserAndScene(sceneModule);
    startTransition(() => setMounted(true));
    setLoading(false);
    onLoaded?.();
  }, [mounted, loading, sceneModule, onLoaded]);

  return (
    <div data-testid="lazy-game-container">
      {!deferredMounted ? (
        <button data-testid="start-button" onClick={onStart} disabled={loading}>
          {loading ? 'Loading' : 'Start Game'}
        </button>
      ) : (
        <Suspense fallback={<div>Loading Scene</div>}>
          {/* Canvas/Scene*/}
          <div data-testid="game-canvas" />
        </Suspense>
      )}
    </div>
  );
}
