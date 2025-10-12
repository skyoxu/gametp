/**
 * Game state events integration hook
 * Combines useGameEvents and useGameState to provide event/state management
 */

import { useCallback, useEffect, useRef } from 'react';
import { useGameEvents } from './useGameEvents';
import { useGameState } from '../contexts/GameStateContext';
import type { GameState } from '../ports/game-engine.port';
// import type { GameDomainEvent } from '../shared/contracts/events/GameEvents';

export interface UseGameStateEventsOptions {
  context?: string;
  autoSync?: boolean; // Auto-sync EventBus events to state
  enableAutoSave?: boolean; // Enable auto-save
  syncInterval?: number; // State sync interval (ms)
}

export function useGameStateEvents(options: UseGameStateEventsOptions = {}) {
  const {
    context = 'game-state-events',
    autoSync = true,
    enableAutoSave = false,
    syncInterval = 1000,
  } = options;

  const gameEvents = useGameEvents({ context });
  const {
    gameState,
    updateGameState,
    saveGame,
    loadGame,
    enableAutoSave: enableContextAutoSave,
    disableAutoSave: disableContextAutoSave,
    syncStates,
  } = useGameState();

  const lastSyncTime = useRef<number>(Date.now());
  const autoSaveEnabled = useRef<boolean>(enableAutoSave);

  // Auto-enable/disable auto-save
  useEffect(() => {
    if (enableAutoSave && !autoSaveEnabled.current) {
      enableContextAutoSave();
      autoSaveEnabled.current = true;
    } else if (!enableAutoSave && autoSaveEnabled.current) {
      disableContextAutoSave();
      autoSaveEnabled.current = false;
    }
  }, [enableAutoSave, enableContextAutoSave, disableContextAutoSave]);

  // Listen to Phaser state updates and sync into React context
  useEffect(() => {
    if (!autoSync) return;

    const subscriptions = gameEvents.onGameStateChange(event => {
      const { gameState: newState } = event.data;
      const now = Date.now();

      // Throttle sync to avoid overly frequent updates
      if (now - lastSyncTime.current >= syncInterval) {
        updateGameState(newState);
        lastSyncTime.current = now;
      }
    });

    return () => {
      subscriptions.forEach(subId => gameEvents.unsubscribe(subId));
    };
  }, [gameEvents, updateGameState, autoSync, syncInterval]);

  // Observe React context state changes and sync to other sources
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      syncStates();
    }, 100); // Short debounce delay

    return () => clearTimeout(timeoutId);
  }, [gameState, syncStates]);

  // Enhanced command sender that also updates React context state
  const sendCommandWithStateUpdate = useCallback(
    async (
      command: 'pause' | 'resume' | 'save' | 'load' | 'restart',
      data?: any
    ): Promise<void> => {
      try {
        switch (command) {
          case 'save': {
            // Save context first, then notify Phaser
            const saveId = await saveGame();
            if (saveId) {
              gameEvents.sendCommandToPhaser('save', { saveId });
            }
            break;
          }

          case 'load': {
            // Load from context first, then notify Phaser
            if (data?.saveId) {
              const success = await loadGame(data.saveId);
              if (success) {
                gameEvents.sendCommandToPhaser('load', data);
              }
            }
            break;
          }

          default: {
            // Forward other commands directly
            gameEvents.sendCommandToPhaser(command, data);
            break;
          }
        }
      } catch (error) {
        console.error(`Failed to execute command ${command}:`, error);
        gameEvents.publish({
          type: 'game.error',
          data: {
            error: (error as Error).message,
            context: `command-${command}`,
            timestamp: new Date(),
          },
        });
      }
    },
    [gameEvents, saveGame, loadGame]
  );

  // Smart state update: merge local updates and remote updates
  const smartUpdateGameState = useCallback(
    (
      stateUpdates: Partial<GameState>,
      source: 'local' | 'remote' = 'local'
    ): void => {
      if (!gameState) return;

      const updatedState: GameState = {
        ...gameState,
        ...stateUpdates,
        timestamp: new Date(),
      };

      // Context
      if (source === 'local') {
        updateGameState(updatedState);

        // Note
        gameEvents.publish({
          type: 'game.state.updated',
          data: { gameState: updatedState, timestamp: new Date() },
        });
      }
      // Remote update: only update context (avoid loops)
      else {
        updateGameState(updatedState);
      }
    },
    [gameState, updateGameState, gameEvents]
  );

  // Batch state updates
  const batchUpdateGameState = useCallback(
    (updates: Array<{ path: keyof GameState; value: any }>): void => {
      if (!gameState) return;

      const newState = { ...gameState };
      updates.forEach(({ path, value }) => {
        (newState as any)[path] = value;
      });

      newState.timestamp = new Date();
      updateGameState(newState);
    },
    [gameState, updateGameState]
  );

  // Create game state snapshot
  const createStateSnapshot = useCallback((): GameState | null => {
    return gameState ? { ...gameState } : null;
  }, [gameState]);

  // Restore game state snapshot
  const restoreStateSnapshot = useCallback(
    (snapshot: GameState): void => {
      updateGameState(snapshot);
      syncStates();
    },
    [updateGameState, syncStates]
  );

  return {
    // Base event system
    ...gameEvents,

    // Current state
    gameState,

    // Enhanced command system
    sendCommand: sendCommandWithStateUpdate,
    sendCommandToPhaser: gameEvents.sendCommandToPhaser,

    // Smart state update
    updateState: smartUpdateGameState,
    batchUpdateState: batchUpdateGameState,

    // State snapshot
    createSnapshot: createStateSnapshot,
    restoreSnapshot: restoreStateSnapshot,

    // State management
    saveGame,
    loadGame,
    syncStates,

    // Utilities
    isStateReady: !!gameState,
    lastSyncTime: lastSyncTime.current,
  };
}

/**
 * Hook: watch specific fields in game state
 * Useful for responding to targeted state changes
 */
export function useGameStateWatcher<T extends keyof GameState>(
  field: T,
  callback: (
    newValue: GameState[T],
    oldValue: GameState[T],
    fullState: GameState
  ) => void,
  dependencies: any[] = []
) {
  const { gameState } = useGameState();
  const lastValueRef = useRef<GameState[T] | undefined>(
    gameState ? gameState[field] : undefined
  );

  useEffect(() => {
    if (!gameState) return;

    const currentValue = gameState[field];
    const lastValue = lastValueRef.current;

    if (lastValue !== undefined && currentValue !== lastValue) {
      callback(currentValue, lastValue, gameState);
    }

    lastValueRef.current = currentValue;
  }, [gameState, field, callback, ...dependencies]);
}

/**
 * Hook: game state performance monitor
 */
export function useGameStatePerformance() {
  const { gameState } = useGameState();
  const metricsRef = useRef({
    updateCount: 0,
    lastUpdate: Date.now(),
    averageUpdateInterval: 0,
  });

  useEffect(() => {
    if (!gameState) return;

    const now = Date.now();
    const metrics = metricsRef.current;

    metrics.updateCount++;
    const interval = now - metrics.lastUpdate;
    metrics.averageUpdateInterval =
      (metrics.averageUpdateInterval + interval) /
      Math.min(metrics.updateCount, 100);
    metrics.lastUpdate = now;
  }, [gameState]);

  return {
    updateCount: metricsRef.current.updateCount,
    averageUpdateInterval: metricsRef.current.averageUpdateInterval,
    lastUpdate: metricsRef.current.lastUpdate,
  };
}
