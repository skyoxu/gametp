/**
 *  -
 *  React UI  Phaser TestScene
 */

import { useRef, useEffect, useCallback } from 'react';
import { useConcurrentState } from '@/hooks/useConcurrentState';
import { GameEngineAdapter } from '../game/GameEngineAdapter';
import type { GameConfig } from '../ports/game-engine.port';
import type { GameDomainEvent } from '../shared/contracts/events/GameEvents';
import { useGameEvents } from '../hooks/useGameEvents';
import { useWebVitals } from '../hooks/useWebVitals';
import { scheduleNonBlocking } from '@/shared/performance/idle';

interface VerticalSliceState {
  phase: 'ready' | 'initializing' | 'playing' | 'completed' | 'error';
  testStartTime?: Date;
  testEndTime?: Date;
  levelResult?: any;
  totalMoves?: number;
  score?: number;
  error?: string;
  events: GameDomainEvent[];
}

interface GameVerticalSliceProps {
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  autoStart?: boolean;
}

export function GameVerticalSlice({
  onComplete,
  onError,
  className = '',
  autoStart = false,
}: GameVerticalSliceProps) {
  const gameEngineRef = useRef<GameEngineAdapter | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    state: sliceState,
    set: setSliceState,
    deferred: _deferredSliceState,
  } = useConcurrentState<VerticalSliceState>({ phase: 'ready', events: [] });

  // Web Vitals -
  const webVitals = useWebVitals({
    enabled: true,
    componentName: 'GameVerticalSlice',
    trackRender: true,
    trackInteractions: true,
    collectorConfig: {
      enabled: true,
      sentryEnabled: true,
      batchSize: 3,
      flushInterval: 5000, // 5
    },
  });

  //
  const gameEvents = useGameEvents({
    context: 'vertical-slice',
    enableAutoCleanup: true,
  });

  /**
   *  -
   */
  const handleGameEvent = useCallback(
    (event: GameDomainEvent) => {
      // ,
      scheduleNonBlocking(() => console.log(' Vertical Slice Event:', event));

      //  GameDomainEvent ,
      const gameEvent = event;

      //
      setSliceState(prev => ({ ...prev, events: [...prev.events, gameEvent] }));

      //
      console.log(' handleGameEvent switch on type:', gameEvent.type);
      switch (gameEvent.type) {
        case 'game.scene.created':
          if (gameEvent.data.sceneKey === 'TestScene') {
            console.log(' TestScene');
            webVitals.recordCustomEvent('test_scene_created');
          }
          break;

        case 'game.player.moved':
          //
          setSliceState(prev => ({
            ...prev,
            totalMoves: (prev.totalMoves || 0) + 1,
          }));
          break;

        case 'game.level.completed':
          // :
          console.log(' Level Completed!', gameEvent.data);
          webVitals.recordCustomEvent('level_completed', {
            score: gameEvent.data.result?.score,
            moves: gameEvent.data.result?.totalMoves,
            duration: gameEvent.data.result?.duration,
          });

          setSliceState(prev => ({
            ...prev,
            phase: 'completed',
            testEndTime: new Date(),
            levelResult: gameEvent.data.result,
            score: gameEvent.data.result?.score,
          }));

          // ()
          handleLevelPersistence(gameEvent.data.result);
          break;

        case 'game.scene.stopped':
          if (gameEvent.data.sceneKey === 'TestScene') {
            console.log(' TestScene');
          }
          break;

        case 'game.error':
          console.error(' :', gameEvent.data);
          setSliceState(prev => ({
            ...prev,
            phase: 'error',
            error: gameEvent.data.error,
          }));
          onError?.(gameEvent.data.error);
          break;
      }

      // Sentry(,)
      if (window.electronAPI) {
        scheduleNonBlocking(() =>
          window.electronAPI!.reportEvent?.({
            type: 'game_event',
            data: {
              eventType: gameEvent.type,
              source: gameEvent.source,
              timestamp: gameEvent.timestamp,
            },
          })
        );
      }
    },
    [webVitals, onError]
  );

  /**
   *
   */
  const handleLevelPersistence = useCallback(
    async (result: any) => {
      try {
        console.log(' ...');
        webVitals.startTiming('data_persistence');

        //  LevelResultService
        const { LevelResultService } = await import(
          '../services/LevelResultService'
        );
        const levelService = new LevelResultService({
          enableBackup: true,
          backupInterval: 10000, // 10
          fallbackToLocalStorage: true,
        });

        //
        const levelCompletionData = {
          levelId: 'test-level-1',
          playerId: `player-${Date.now()}`,
          startTime: sliceState.testStartTime || new Date(),
          endTime: sliceState.testEndTime || new Date(),
          duration: result.duration || 0,
          score: result.score || 0,
          totalMoves: result.totalMoves || 0,
          completionReason: result.completionReason || 'goal_reached',
          gameEvents: sliceState.events,
          metadata: {
            version: '1.0.0',
            testType: 'vertical-slice' as const,
            webVitals: {
              testDuration: sliceState.testEndTime
                ? sliceState.testEndTime.getTime() -
                  (sliceState.testStartTime?.getTime() || 0)
                : 0,
            },
            sessionId: `session-${Date.now()}`,
          },
        };

        //
        const saveResult =
          await levelService.saveLevelResult(levelCompletionData);

        if (saveResult.success) {
          console.log(' , ID:', saveResult.data);

          //
          const statsResult = await levelService.getStats();
          if (statsResult.success) {
            console.log(' :', statsResult.data);
          }

          const persistenceData = {
            testId: saveResult.data,
            timestamp: new Date().toISOString(),
            result: levelCompletionData,
            stats: statsResult.data,
          };

          webVitals.endTiming('data_persistence');
          onComplete?.(persistenceData);

          //
          levelService.dispose();
        } else {
          throw new Error(saveResult.error || 'Unknown persistence error');
        }
      } catch (error) {
        console.error(' :', error);
        webVitals.recordError(error as Error, 'data_persistence');
        setSliceState(prev => ({
          ...prev,
          error: `: ${(error as Error).message}`,
        }));
      }
    },
    [sliceState, webVitals, onComplete]
  );

  /**
   * TestScene
   */
  const initializeGameEngine = useCallback(async () => {
    console.log(
      ' initializeGameEngine called, canvasRef.current:',
      !!canvasRef.current,
      'gameEngineRef.current:',
      !!gameEngineRef.current
    );

    if (!canvasRef.current || gameEngineRef.current) {
      console.warn(
        ' Early return from initializeGameEngine - canvas:',
        !!canvasRef.current,
        'engine:',
        !!gameEngineRef.current
      );
      return;
    }

    try {
      console.log(' Setting state to initializing...');
      setSliceState(prev => ({ ...prev, phase: 'initializing' }));
      webVitals.startTiming('game_engine_init');

      const gameConfig: GameConfig = {
        maxLevel: 50,
        initialHealth: 100,
        scoreMultiplier: 1.0,
        autoSave: true,
        difficulty: 'medium',
      };

      //
      gameEngineRef.current = new GameEngineAdapter();

      //
      gameEngineRef.current.setContainer(canvasRef.current);

      //  -
      gameEngineRef.current.onGameEvent((event: any) => {
        //  DomainEvent  GameDomainEvent
        if (event.type?.startsWith?.('game.')) {
          handleGameEvent(event as GameDomainEvent);
        }
      });

      //
      await gameEngineRef.current.initializeGame(gameConfig);

      // TestScene
      await gameEngineRef.current.startGame();

      // TestScene
      const sceneManager = (gameEngineRef.current as any).sceneManager;
      if (sceneManager && sceneManager.game) {
        sceneManager.game.scene.start('TestScene');
        sceneManager.game.scene.stop('MenuScene');
      }

      console.log(' TestScene');
      webVitals.endTiming('game_engine_init');

      console.log(' Setting state to playing...');
      setSliceState(prev => ({
        ...prev,
        phase: 'playing',
        testStartTime: new Date(),
      }));
      console.log(' State set to playing complete');
    } catch (error) {
      console.error(' :', error);
      webVitals.recordError(error as Error, 'game_engine_init');
      setSliceState(prev => ({
        ...prev,
        phase: 'error',
        error: (error as Error).message,
      }));
      onError?.((error as Error).message);
    }
  }, [handleGameEvent, webVitals, onError]);

  /**
   *
   */
  const cleanupGameEngine = useCallback(() => {
    if (gameEngineRef.current) {
      try {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
        console.log(' ');
      } catch (error) {
        console.error(' :', error);
      }
    }
  }, []);

  /**
   *
   */
  const resetTest = useCallback(() => {
    cleanupGameEngine();
    setSliceState({
      phase: 'ready',
      events: [],
    });
  }, [cleanupGameEngine]);

  /**
   *
   */
  const startTest = useCallback(() => {
    console.log(' startTest called!');
    webVitals.recordCustomEvent('vertical_slice_start');
    console.log(' About to call initializeGameEngine...');
    initializeGameEngine();
    console.log(' initializeGameEngine call completed');
  }, [initializeGameEngine, webVitals]);

  //
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(startTest, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, startTest]);

  //
  useEffect(() => {
    if (sliceState.phase !== 'playing') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(' Keyboard event received:', event.key, event.code);

      if (gameEngineRef.current) {
        const gameInput = {
          type: 'keyboard' as const,
          action: 'keydown' as const,
          data: {
            key: event.key.toLowerCase(),
            code: event.code,
          },
          timestamp: new Date(),
        };

        console.log(' Sending input to game engine:', gameInput);
        gameEngineRef.current.handleInput(gameInput);
      }
    };

    //
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sliceState.phase]);

  //
  useEffect(() => {
    console.log(' GameVerticalSlice: ');

    //
    const subscriptions = [
      gameEvents.subscribe('game.level.completed', handleGameEvent),
      gameEvents.subscribe('game.scene.created', handleGameEvent),
      gameEvents.subscribe('game.player.moved', handleGameEvent),
      gameEvents.subscribe('game.error', handleGameEvent),
      gameEvents.subscribe('game.warning', handleGameEvent),
    ];

    console.log(' GameVerticalSlice: :', subscriptions.length);
    console.log(' GameVerticalSlice: ID:', subscriptions);

    //
    const stats = gameEvents.getStats();
    console.log(' GameVerticalSlice: :', stats);

    return () => {
      console.log(' GameVerticalSlice: ');
      subscriptions.forEach(subscriptionId => {
        gameEvents.unsubscribe(subscriptionId);
      });
    };
  }, [gameEvents, handleGameEvent]);

  //
  useEffect(() => {
    return () => {
      cleanupGameEngine();
    };
  }, [cleanupGameEngine]);

  /**
   * UI
   */
  const renderPhaseUI = () => {
    switch (sliceState.phase) {
      case 'ready':
        return (
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-white mb-4"></h2>
            <p className="text-gray-300 mb-6">React Phaser</p>
            <button
              onClick={startTest}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            ></button>
          </div>
        );

      case 'initializing':
        return (
          <div className="text-center p-8">
            <h2 className="text-xl font-bold text-white mb-4">...</h2>
            <div className="animate-pulse text-blue-400">TestScene</div>
          </div>
        );

      case 'playing':
        return (
          <div className="p-4 bg-gray-800 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white"></h3>
              <div className="text-sm text-gray-300">
                : {sliceState.totalMoves || 0}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">WASD</div>
          </div>
        );

      case 'completed':
        return (
          <div className="p-6 bg-green-800 rounded-t-lg">
            <h2 className="text-xl font-bold text-white mb-4"> </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-green-200">: {sliceState.score || 0}</div>
              <div className="text-green-200">
                : {sliceState.levelResult?.totalMoves || 0}
              </div>
              <div className="text-green-200">
                :{' '}
                {sliceState.levelResult?.duration
                  ? Math.round(sliceState.levelResult.duration / 1000) + ''
                  : 'N/A'}
              </div>
              <div className="text-green-200">: {sliceState.events.length}</div>
            </div>
            <button
              onClick={resetTest}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            ></button>
          </div>
        );

      case 'error':
        return (
          <div className="p-6 bg-red-800 rounded-t-lg">
            <h2 className="text-xl font-bold text-white mb-4"> </h2>
            <div className="text-red-200 text-sm mb-4">{sliceState.error}</div>
            <button
              onClick={resetTest}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            ></button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`game-vertical-slice ${className}`}>
      {renderPhaseUI()}

      {/*  -  */}
      <div
        ref={canvasRef}
        className={`game-canvas-container border border-gray-600 w-[800px] h-[600px] ${
          sliceState.phase === 'ready' || sliceState.phase === 'error'
            ? 'hidden'
            : ''
        }`}
      />

      {/* ()*/}
      {process.env.NODE_ENV === 'development' &&
        sliceState.events.length > 0 && (
          <details className="mt-4 p-4 bg-gray-900 rounded text-xs">
            <summary className="text-white cursor-pointer">
              ({sliceState.events.length} )
            </summary>
            <div className="mt-2 max-h-40 overflow-y-auto text-gray-300">
              {sliceState.events.slice(-10).map((event, index) => (
                <div key={index} className="mb-1">
                  <span className="text-blue-400">{event.type}</span>
                  {' - '}
                  <span className="text-yellow-400">{event.source}</span>
                  {event.data && (
                    <span className="text-gray-500 ml-2">
                      {JSON.stringify(event.data).substring(0, 100)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
    </div>
  );
}
