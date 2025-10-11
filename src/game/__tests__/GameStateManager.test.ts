/**
 * GameStateManager tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../state/GameStateManager';
import type { GameState, GameConfig } from '../../ports/game-engine.port';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    // keys Object.keys(localStorage)
    _getAllKeys: () => Object.keys(store),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock Object.keys localStorage
const originalObjectKeys = Object.keys;
Object.keys = vi.fn(obj => {
  if (obj === localStorage) {
    return (localStorage as any)._getAllKeys();
  }
  return originalObjectKeys(obj);
});

describe('GameStateManager', () => {
  let stateManager: GameStateManager;
  let mockState: GameState;
  let mockConfig: GameConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();

    stateManager = new GameStateManager({
      storageKey: 'test-game',
      maxSaves: 5,
      autoSaveInterval: 1000,
      enableCompression: false,
    });

    mockState = {
      id: 'test-game-1',
      level: 5,
      score: 1000,
      health: 80,
      inventory: ['sword', 'potion'],
      position: { x: 100, y: 200 },
      timestamp: new Date(),
    };

    mockConfig = {
      maxLevel: 50,
      initialHealth: 100,
      scoreMultiplier: 1.0,
      autoSave: true,
      difficulty: 'medium',
    };
  });

  afterEach(() => {
    stateManager.destroy();
  });

  describe('', () => {
    it('', () => {
      stateManager.setState(mockState, mockConfig);

      const retrievedState = stateManager.getState();
      const retrievedConfig = stateManager.getConfig();

      expect(retrievedState).toEqual(mockState);
      expect(retrievedConfig).toEqual(mockConfig);
    });

    it('', () => {
      expect(stateManager.getState()).toBeNull();
      expect(stateManager.getConfig()).toBeNull();
    });

    it('', () => {
      return new Promise<void>(resolve => {
        stateManager.onEvent(event => {
          if (event.type === 'game.state.manager.updated') {
            expect(event.data.state).toEqual(mockState);
            expect(event.data.config).toEqual(mockConfig);
            resolve();
          }
        });

        stateManager.setState(mockState, mockConfig);
      });
    });
  });

  describe('', () => {
    beforeEach(() => {
      stateManager.setState(mockState, mockConfig);
    });

    it('', async () => {
      const saveId = await stateManager.saveGame('test-save');

      expect(saveId).toBeTruthy();
      expect(typeof saveId).toBe('string');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('', async () => {
      const saveId = await stateManager.saveGame('test-save');

      // Note
      const newStateManager = new GameStateManager();

      const { state, config } = await newStateManager.loadGame(saveId);

      expect(state.id).toBe(mockState.id);
      expect(state.level).toBe(mockState.level);
      expect(state.score).toBe(mockState.score);
      expect(config.difficulty).toBe(mockConfig.difficulty);

      newStateManager.destroy();
    });

    it('', async () => {
      const saveId1 = await stateManager.saveGame('save1');
      const saveId2 = await stateManager.saveGame('save2');

      // Note
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);

      const saveList = await stateManager.getSaveList();

      // ID
      expect(saveList.length).toBeGreaterThan(0);
      expect(saveList[0].metadata).toBeDefined();
      expect(saveList[0].state).toBeDefined();
      expect(saveList[0].config).toBeDefined();
    });

    it('', async () => {
      const saveId = await stateManager.saveGame('test-delete');

      await stateManager.deleteSave(saveId);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(saveId);
    });

    it('', async () => {
      await expect(stateManager.loadGame('nonexistent')).rejects.toThrow(
        'Save not found: nonexistent'
      );
    });

    it('', async () => {
      const emptyStateManager = new GameStateManager();

      await expect(emptyStateManager.saveGame()).rejects.toThrow(
        'No game state to save'
      );

      emptyStateManager.destroy();
    });

    it('', async () => {
      const limitedStateManager = new GameStateManager({
        maxSaves: 2,
      });
      limitedStateManager.setState(mockState, mockConfig);

      // 3 2
      await limitedStateManager.saveGame('save1');
      await limitedStateManager.saveGame('save2');
      await limitedStateManager.saveGame('save3');

      const saveList = await limitedStateManager.getSaveList();
      expect(saveList.length).toBeLessThanOrEqual(2);

      limitedStateManager.destroy();
    });
  });

  describe('', () => {
    beforeEach(() => {
      stateManager.setState(mockState, mockConfig);
    });

    it('', () => {
      const eventHandler = vi.fn();
      stateManager.onEvent(eventHandler);

      stateManager.enableAutoSave();

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game.autosave.enabled',
        })
      );
    });

    it('', () => {
      stateManager.enableAutoSave();

      const eventHandler = vi.fn();
      stateManager.onEvent(eventHandler);

      stateManager.disableAutoSave();

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game.autosave.disabled',
        })
      );
    });

    it('', () => {
      stateManager.enableAutoSave();

      expect(() => {
        stateManager.enableAutoSave(); // Note
      }).not.toThrow();
    });

    it('', () => {
      return new Promise<void>(resolve => {
        const shortIntervalStateManager = new GameStateManager({
          autoSaveInterval: 100, // 100ms
        });
        shortIntervalStateManager.setState(mockState, mockConfig);

        shortIntervalStateManager.onEvent(event => {
          if (event.type === 'game.autosave.completed') {
            expect(event.data.saveId).toBeTruthy();
            shortIntervalStateManager.destroy();
            resolve();
          }
        });

        shortIntervalStateManager.enableAutoSave();
      });
    });
  });

  describe('', () => {
    beforeEach(() => {
      stateManager.setState(mockState, mockConfig);
    });

    it('', () => {
      const eventHandler = vi.fn();

      stateManager.onEvent(eventHandler);
      stateManager.setState(mockState, mockConfig);

      expect(eventHandler).toHaveBeenCalled();

      eventHandler.mockClear();
      stateManager.offEvent(eventHandler);
      stateManager.setState({ ...mockState, level: 10 }, mockConfig);

      expect(eventHandler).not.toHaveBeenCalled();
    });

    it('', async () => {
      const eventHandler = vi.fn();
      stateManager.onEvent(eventHandler);

      await stateManager.saveGame('test-save');

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game.save.created',
        })
      );
    });

    it('', async () => {
      const saveId = await stateManager.saveGame('test-save');

      const eventHandler = vi.fn();
      stateManager.onEvent(eventHandler);

      await stateManager.loadGame(saveId);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game.save.loaded',
        })
      );
    });

    it('', async () => {
      const saveId = await stateManager.saveGame('test-save');

      const eventHandler = vi.fn();
      stateManager.onEvent(eventHandler);

      await stateManager.deleteSave(saveId);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game.save.deleted',
        })
      );
    });
  });

  describe('', () => {
    it('', async () => {
      const corruptedData = 'invalid-json-data';
      mockLocalStorage.setItem('test-corrupt-save', corruptedData);

      await expect(
        stateManager.loadGame('test-corrupt-save')
      ).rejects.toThrow();
    });

    it('', async () => {
      stateManager.setState(mockState, mockConfig);

      // Note
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(stateManager.saveGame()).rejects.toThrow();
    });

    it('', () => {
      stateManager.setState(mockState, mockConfig);
      stateManager.enableAutoSave();

      const eventHandler = vi.fn();
      stateManager.onEvent(eventHandler);

      stateManager.destroy();

      // Note
      expect(stateManager.getState()).toBeNull();
      expect(stateManager.getConfig()).toBeNull();
    });
  });
});
