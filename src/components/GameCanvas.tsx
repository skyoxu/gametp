/**
 * Phaser game canvas component
 * Hosts the Phaser 3 WebGL renderer and scene lifecycle under React.
 * References: ADR-0001 (tech stack), ADR-0004 (events/contracts)
 */

import { useRef, useEffect, useState, useCallback, useTransition } from 'react';
import { GameEngineAdapter } from '../game/GameEngineAdapter';
import type { GameState, GameConfig } from '../ports/game-engine.port';
import type { DomainEvent } from '../shared/contracts/events';
import type { GameDomainEvent } from '../shared/contracts/events/GameEvents';
import { useGameEvents } from '../hooks/useGameEvents';
import { createComputationWorker } from '@/shared/workers/workerBridge';
import './GameCanvas.css';
import { scheduleNonBlocking } from '@/shared/performance/idle';
import { startTransaction } from '@/shared/observability/sentry-perf';
import { useI18n } from '@/i18n';

/**
 * Component props for GameCanvas
 * - width/height: canvas size in pixels
 * - className: additional class names for the container
 * - onGameEvent: callback for published domain events
 * - onGameStateChange: callback when game state updates
 * - autoStart: start the game session automatically after init
 */
interface GameCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onGameEvent?: (event: DomainEvent) => void;
  onGameStateChange?: (state: GameState) => void;
  autoStart?: boolean;
}

/**
 * GameCanvas component
 * @param props.width canvas width (px)
 * @param props.height canvas height (px)
 * @param props.className extra class names on root container
 * @param props.onGameEvent callback invoked for each domain event
 * @param props.onGameStateChange callback invoked when game state updates
 * @param props.autoStart if true, starts the game session after initialization
 * @returns React component that mounts/unmounts a Phaser game instance
 */
export function GameCanvas({
  width = 800,
  height = 600,
  className = '',
  onGameEvent,
  onGameStateChange,
  autoStart = true,
}: GameCanvasProps) {
  const t = useI18n();
  const gameEngineRef = useRef<GameEngineAdapter | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_isPending, startTransition] = useTransition();
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionDone, setInteractionDone] = useState(false);

  // Bridge React <-> Phaser via EventBus
  const gameEvents = useGameEvents({
    context: 'game-canvas',
    enableAutoCleanup: true,
  });

  // Handle game events
  const handleGameEvent = useCallback(
    (event: DomainEvent) => {
      console.log('Game Event:', event);

      // Filter non-game domain events
      if (
        !event.type.startsWith('game.') &&
        !event.type.startsWith('phaser.') &&
        !event.type.startsWith('react.')
      ) {
        return;
      }

      const gameEvent = event as unknown as GameDomainEvent;

      // Update state with low-priority transition to keep UI responsive
      if (
        gameEvent.type === 'game.state.updated' ||
        gameEvent.type === 'game.state.changed'
      ) {
        const { gameState: newState } = gameEvent.data.gameState
          ? { gameState: gameEvent.data.gameState }
          : (gameEvent.data as { gameState: GameState });
        startTransition(() => {
          setGameState(newState);
          onGameStateChange?.(newState);
        });
      }

      // Error and warning routing
      if (
        gameEvent.type === 'game.error' &&
        gameEvent.data &&
        'error' in gameEvent.data
      ) {
        setError((gameEvent.data as any).error);
      } else if (
        gameEvent.type === 'game.warning' &&
        gameEvent.data &&
        'warning' in gameEvent.data
      ) {
        // Non-critical logs off the critical path
        scheduleNonBlocking(() => {
          console.warn('Game warning:', (gameEvent.data as any).warning);
        });
      }

      // Forward events
      if (onGameEvent) {
        scheduleNonBlocking(() => onGameEvent(event));
      }
    },
    [onGameEvent, onGameStateChange]
  );

  // Initialize game engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const initGame = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create engine instance
        const gameEngine = new GameEngineAdapter();
        gameEngineRef.current = gameEngine;

        // Note
        gameEngine.setContainer(canvasRef.current!);

        // Subscribe to game events
        gameEngine.onGameEvent(handleGameEvent);

        // Initialize game config
        const gameConfig: GameConfig = {
          maxLevel: 50,
          initialHealth: 100,
          scoreMultiplier: 1.0,
          autoSave: true,
          difficulty: 'medium',
        };

        // Initialize game
        const initialState = await gameEngine.initializeGame(gameConfig);
        setGameState(initialState);

        // Note
        if (autoStart) {
          await gameEngine.startGame();
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        setError((error as Error).message);
        setIsLoading(false);
      }
    };

    initGame();

    // Note
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
    };
  }, [width, height, autoStart, handleGameEvent]);

  // EventBus
  useEffect(() => {
    const subscriptions = gameEvents.onGameStateChange(event => {
      console.log('Game state changed via EventBus:', event);
      setGameState(event.data.gameState);
      onGameStateChange?.(event.data.gameState);
    });

    return () => {
      subscriptions.forEach(subId => gameEvents.unsubscribe(subId));
    };
  }, [gameEvents, onGameStateChange]);

  // Listen for error/warning events
  useEffect(() => {
    const subscriptions = gameEvents.onGameError(event => {
      console.error('Game error via EventBus:', event);
      if (event.type === 'game.error' && 'error' in event.data) {
        setError(event.data.error);
      } else if (event.type === 'game.warning' && 'warning' in event.data) {
        setError(event.data.warning);
      }
    });

    return () => {
      subscriptions.forEach(subId => gameEvents.unsubscribe(subId));
    };
  }, [gameEvents]);

  // Listen for Phaser responses
  useEffect(() => {
    const subscriptions = gameEvents.onPhaserResponse(event => {
      console.log('Phaser response:', event);
      if (event.type === 'phaser.response.ready') {
        console.log('Phaser engine is ready');
      }
    });

    return () => {
      subscriptions.forEach(subId => gameEvents.unsubscribe(subId));
    };
  }, [gameEvents]);

  // - EventBus
  const pauseGame = useCallback(() => {
    gameEvents.sendCommandToPhaser('pause');
  }, [gameEvents]);

  const resumeGame = useCallback(() => {
    gameEvents.sendCommandToPhaser('resume');
  }, [gameEvents]);

  const saveGame = useCallback(() => {
    gameEvents.sendCommandToPhaser('save');
  }, [gameEvents]);

  const _loadGame = useCallback(
    (saveId: string) => {
      gameEvents.sendCommandToPhaser('load', { saveId });
    },
    [gameEvents]
  );

  const restartGame = useCallback(() => {
    gameEvents.sendCommandToPhaser('restart');
  }, [gameEvents]);

  // Render loading state
  if (isLoading) {
    return (
      <div
        className={`game-canvas loading ${className}`}
        style={{ width, height }}
      >
        <div className="game-canvas__loading-text">
          {t('interface.loading')}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div
        className={`game-canvas error ${className}`}
        style={{ width, height }}
      >
        <div className="game-canvas__error-title">
          {t('notifications.errorTitle')}
        </div>
        <div className="game-canvas__error-details">{error}</div>
      </div>
    );
  }

  return (
    <div className={`game-canvas ${className}`}>
      <div
        ref={canvasRef}
        className="game-canvas__content"
        style={{ width, height }}
      />

      {/* Game status panel (optional) */}
      {gameState && (
        <div className="game-canvas__status-panel">
          <div>
            {t('statusPanel.score')}: {gameState.score}
          </div>
          <div>
            {t('statusPanel.level')}: {gameState.level}
          </div>
          <div>
            {t('statusPanel.health')}: {gameState.health}
          </div>
        </div>
      )}

      {/* Game control buttons */}
      <div className="game-canvas__controls">
        <button
          onClick={pauseGame}
          className="game-canvas__control-btn game-canvas__control-btn--pause"
          title={t('controlPanel.titlePause')}
          aria-label={t('controlPanel.ariaPause')}
        >
          {t('controlPanel.pause')}
        </button>
        <button
          onClick={resumeGame}
          className="game-canvas__control-btn game-canvas__control-btn--resume"
          title={t('controlPanel.titleResume')}
          aria-label={t('controlPanel.ariaResume')}
        >
          {t('controlPanel.resume')}
        </button>
        <button
          onClick={saveGame}
          className="game-canvas__control-btn game-canvas__control-btn--save"
          title={t('controlPanel.titleSave')}
          aria-label={t('controlPanel.ariaSave')}
        >
          {t('controlPanel.save')}
        </button>
        <button
          onClick={restartGame}
          className="game-canvas__control-btn game-canvas__control-btn--restart"
          title={t('controlPanel.titleRestart')}
          aria-label={t('controlPanel.ariaRestart')}
        >
          {t('controlPanel.restart')}
        </button>
        <button
          data-testid="test-button"
          disabled={interactionLoading}
          onClick={async () => {
            try {
              setInteractionLoading(true);
              const txn = await startTransaction(
                'interaction:test_button',
                'ui.action'
              );
              if (typeof performance !== 'undefined' && performance.mark) {
                performance.mark('test_button_click_start');
              }
              await new Promise(r =>
                requestAnimationFrame(() => requestAnimationFrame(r))
              );
              const { heavyTask, terminate } = createComputationWorker();
              await heavyTask(5_000_000);
              terminate();
              setInteractionDone(true);
              if (
                typeof performance !== 'undefined' &&
                performance.mark &&
                performance.measure
              ) {
                performance.mark('response_indicator_visible');
                performance.measure(
                  'test_button_latency',
                  'test_button_click_start',
                  'response_indicator_visible'
                );
              }
              txn.finish();
            } catch (e) {
              console.error('worker heavyTask failed', e);
            } finally {
              setInteractionLoading(false);
              setTimeout(() => setInteractionDone(false), 60);
            }
          }}
          className="game-canvas__control-btn game-canvas__control-btn--test"
        >
          {interactionLoading ? '' : t('interface.debug')}
        </button>
      </div>

      {interactionDone && (
        <div
          data-testid="response-indicator"
          aria-live="polite"
          style={{ position: 'absolute', top: -9999, left: -9999 }}
        >
          done
        </div>
      )}
    </div>
  );
}
