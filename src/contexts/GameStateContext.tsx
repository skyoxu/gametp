/**
 * Game state context
 * Provides direct integration between React components and the game state manager
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import type { GameState, GameConfig } from '../ports/game-engine.port';
import type { SaveData } from '../game/state/GameStateManager';
import { GameStateManager } from '../game/state/GameStateManager';
import {
  StateSynchronizer,
  type StateSource,
} from '../game/state/StateSynchronizer';
import type { DomainEvent } from '../shared/contracts/events';
import { useGameEvents } from '../hooks/useGameEvents';

export interface GameStateContextValue {
  // Current game state
  gameState: GameState | null;
  gameConfig: GameConfig | null;

  // Save management
  saveFiles: SaveData[];
  isLoadingSaves: boolean;

  // State management operations
  saveGame: () => Promise<string | null>;
  loadGame: (saveId: string) => Promise<boolean>;
  deleteSave: (saveId: string) => Promise<boolean>;
  refreshSaveList: () => Promise<void>;

  // State update
  updateGameState: (newState: Partial<GameState>) => void;
  resetGameState: () => void;

  // Auto-save controls
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  isAutoSaveEnabled: boolean;

  // State synchronization controls
  registerStateSource: (source: StateSource, priority?: number) => void;
  unregisterStateSource: (sourceId: string) => void;
  syncStates: () => void;
}

const GameStateContext = createContext<GameStateContextValue | undefined>(
  undefined
);

export interface GameStateProviderProps {
  children: ReactNode;
  stateManagerOptions?: {
    storageKey?: string;
    maxSaves?: number;
    autoSaveInterval?: number;
    enableCompression?: boolean;
  };
  synchronizerOptions?: {
    syncInterval?: number;
    conflictResolution?: 'latest' | 'priority' | 'merge';
    enableBidirectionalSync?: boolean;
  };
}

export function GameStateProvider({
  children,
  stateManagerOptions = {},
  synchronizerOptions = {},
}: GameStateProviderProps) {
  // Instances of state manager and synchronizer
  const [stateManager] = useState(
    () =>
      new GameStateManager({
        storageKey: 'guild-manager-game',
        maxSaves: 20,
        autoSaveInterval: 30000,
        enableCompression: true,
        ...stateManagerOptions,
      })
  );

  const [stateSynchronizer] = useState(
    () =>
      new StateSynchronizer({
        syncInterval: 500, // Higher frequency sync to ensure React UI responsiveness
        conflictResolution: 'priority',
        enableBidirectionalSync: true,
        ...synchronizerOptions,
      })
  );

  // React state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [saveFiles, setSaveFiles] = useState<SaveData[]>([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);

  // EventBus integration
  const gameEvents = useGameEvents({ context: 'game-state-context' });

  // React state source implementation
  const reactStateSource = useMemo<StateSource>(
    () => ({
      id: 'react-ui',
      getState: () => gameState,
      setState: (state: GameState) => {
        setGameState({ ...state });
        setGameConfig(stateManager.getConfig() || null);
      },
    }),
    [gameState, stateManager]
  );

  // Listen to state manager events
  useEffect(() => {
    const handleStateManagerEvent = (event: DomainEvent) => {
      switch (event.type) {
        case 'game.state.updated':
          if (
            event.data &&
            typeof event.data === 'object' &&
            'gameState' in event.data &&
            typeof event.data.gameState === 'object' &&
            event.data.gameState !== null
          ) {
            setGameState({ ...(event.data.gameState as GameState) });
          }
          break;

        case 'game.save.created':
        case 'game.save.loaded':
        case 'game.save.deleted':
          // 
          refreshSaveList();
          break;

        case 'game.autosave.enabled':
          setIsAutoSaveEnabled(true);
          break;

        case 'game.autosave.disabled':
          setIsAutoSaveEnabled(false);
          break;
      }
    };

    stateManager.onEvent(handleStateManagerEvent);
    stateSynchronizer.onEvent(handleStateManagerEvent);

    return () => {
      stateManager.offEvent(handleStateManagerEvent);
      stateSynchronizer.offEvent(handleStateManagerEvent);
    };
  }, [stateManager, stateSynchronizer]);

  // 
  useEffect(() => {
    const subscriptions = gameEvents.onGameStateChange(event => {
      const { gameState: updatedState } = event.data;
      stateManager.setState(updatedState);
    });

    return () => {
      subscriptions.forEach(subId => gameEvents.unsubscribe(subId));
    };
  }, [gameEvents, stateManager]);

  // React
  useEffect(() => {
    stateSynchronizer.registerSource(reactStateSource, 5); // 
    stateSynchronizer.startSync();

    return () => {
      stateSynchronizer.unregisterSource('react-ui');
      stateSynchronizer.stopSync();
    };
  }, [stateSynchronizer, reactStateSource]);

  // Save game
  const saveGame = useCallback(async (): Promise<string | null> => {
    try {
      if (!gameState || !gameConfig) {
        console.warn('No game state or config to save');
        return null;
      }

      stateManager.setState(gameState, gameConfig);
      const saveId = await stateManager.saveGame();

  // Notify other components via EventBus
      gameEvents.publish({
        type: 'game.save.created',
        data: { saveId, gameState },
        source: '/vitegame/game-engine',
        timestamp: new Date(),
      });

      return saveId;
    } catch (error) {
      console.error('Failed to save game:', error);
      gameEvents.publish({
        type: 'game.error',
        data: {
          error: (error as Error).message,
          context: 'context-save',
          timestamp: new Date(),
        },
        source: '/vitegame/game-engine',
        timestamp: new Date(),
      });
      return null;
    }
  }, [gameState, gameConfig, stateManager, gameEvents]);

  // Load game
  const loadGame = useCallback(
    async (saveId: string): Promise<boolean> => {
      try {
        const { state, config: _config } = await stateManager.loadGame(saveId);

  // Force sync to all state sources
        stateSynchronizer.forceState(state);

  // Notify game engine via EventBus
        gameEvents.sendCommandToPhaser('load', { saveId });

        return true;
      } catch (error) {
        console.error('Failed to load game:', error);
        gameEvents.publish({
          type: 'game.error',
          data: {
            error: (error as Error).message,
            context: 'context-load',
            timestamp: new Date(),
          },
          source: '/vitegame/game-engine',
          timestamp: new Date(),
        });
        return false;
      }
    },
    [stateManager, stateSynchronizer, gameEvents]
  );

  // Delete save
  const deleteSave = useCallback(
    async (saveId: string): Promise<boolean> => {
      try {
        await stateManager.deleteSave(saveId);
        return true;
      } catch (error) {
        console.error('Failed to delete save:', error);
        return false;
      }
    },
    [stateManager]
  );

  // Refresh save list
  const refreshSaveList = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingSaves(true);
      const saves = await stateManager.getSaveList();
      setSaveFiles(saves);
    } catch (error) {
      console.error('Failed to refresh save list:', error);
      setSaveFiles([]);
    } finally {
      setIsLoadingSaves(false);
    }
  }, [stateManager]);

  // Update game state
  const updateGameState = useCallback(
    (newState: Partial<GameState>): void => {
      if (!gameState) return;

      const updatedState: GameState = {
        ...gameState,
        ...newState,
        timestamp: new Date(),
      };

      setGameState(updatedState);
      stateManager.setState(updatedState, gameConfig || undefined);
    },
    [gameState, gameConfig, stateManager]
  );

  // Reset game state
  const resetGameState = useCallback((): void => {
    const initialState: GameState = {
      id: `game-${Date.now()}`,
      level: 1,
      score: 0,
      health: 100,
      inventory: [],
      position: { x: 400, y: 300 },
      timestamp: new Date(),
    };

    setGameState(initialState);
    stateManager.setState(initialState, gameConfig || undefined);
    stateSynchronizer.forceState(initialState);
  }, [gameConfig, stateManager, stateSynchronizer]);

  // Enable auto-save
  const enableAutoSave = useCallback((): void => {
    stateManager.enableAutoSave();
  }, [stateManager]);

  // Disable auto-save
  const disableAutoSave = useCallback((): void => {
    stateManager.disableAutoSave();
  }, [stateManager]);

  // Register state source
  const registerStateSource = useCallback(
    (source: StateSource, priority: number = 0): void => {
      stateSynchronizer.registerSource(source, priority);
    },
    [stateSynchronizer]
  );

  // Unregister state source
  const unregisterStateSource = useCallback(
    (sourceId: string): void => {
      stateSynchronizer.unregisterSource(sourceId);
    },
    [stateSynchronizer]
  );

  // Manually trigger state synchronization
  const syncStates = useCallback((): void => {
    stateSynchronizer.sync();
  }, [stateSynchronizer]);

  // Initialize save list
  useEffect(() => {
    refreshSaveList();
  }, [refreshSaveList]);

  // Cleanup resources
  useEffect(() => {
    return () => {
      stateManager.destroy();
      stateSynchronizer.destroy();
    };
  }, [stateManager, stateSynchronizer]);

  const contextValue: GameStateContextValue = {
    gameState,
    gameConfig,
    saveFiles,
    isLoadingSaves,
    saveGame,
    loadGame,
    deleteSave,
    refreshSaveList,
    updateGameState,
    resetGameState,
    enableAutoSave,
    disableAutoSave,
    isAutoSaveEnabled,
    registerStateSource,
    unregisterStateSource,
    syncStates,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}

/**
 * Hook: use the game state context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useGameState(): GameStateContextValue {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

/**
 * Optional: hook for save management
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useSaveManager() {
  const {
    saveFiles,
    isLoadingSaves,
    saveGame,
    loadGame,
    deleteSave,
    refreshSaveList,
  } = useGameState();

  return {
    saveFiles,
    isLoadingSaves,
    saveGame,
    loadGame,
    deleteSave,
    refreshSaveList,
  };
}

/**
 * Optional: hook for state synchronization
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useStateSynchronizer() {
  const { registerStateSource, unregisterStateSource, syncStates, gameState } =
    useGameState();

  return {
    registerStateSource,
    unregisterStateSource,
    syncStates,
    currentState: gameState,
  };
}
