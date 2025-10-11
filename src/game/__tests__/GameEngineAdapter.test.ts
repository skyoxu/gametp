/**
 * GameEngineAdapter tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngineAdapter } from '../GameEngineAdapter';
import type { GameConfig, GameState } from '../../ports/game-engine.port';

// Mock Phaser BaseScene Phaser
vi.mock('phaser', () => import('./__mocks__/phaser'));
import Phaser from 'phaser';
(globalThis as any).Phaser = Phaser as any;

// Mock DOM API
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock Performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
  writable: true,
});

describe('GameEngineAdapter', () => {
  let gameEngine: GameEngineAdapter;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Note
    mockContainer = document.createElement('div');
    mockContainer.style.width = '800px';
    mockContainer.style.height = '600px';
    document.body.appendChild(mockContainer);

    // Create engine instance
    gameEngine = new GameEngineAdapter();
    gameEngine.setContainer(mockContainer);
  });

  afterEach(() => {
    // Note
    gameEngine.destroy();
    document.body.removeChild(mockContainer);
    vi.clearAllMocks();
  });

  describe('', () => {
    it('', () => {
      expect(gameEngine).toBeDefined();
      expect(gameEngine.getStateMachineState()).toBe('boot');
    });

    it('', async () => {
      const config: GameConfig = {
        maxLevel: 50,
        initialHealth: 100,
        scoreMultiplier: 1.0,
        autoSave: true,
        difficulty: 'medium',
      };

      const initialState = await gameEngine.initializeGame(config);

      expect(initialState).toBeDefined();
      expect(initialState.health).toBe(100);
      expect(initialState.level).toBe(1);
      expect(initialState.score).toBe(0);
      expect(gameEngine.getStateMachineState()).toBe('running');
    });
  });

  describe('', () => {
    beforeEach(async () => {
      const config: GameConfig = {
        maxLevel: 50,
        initialHealth: 100,
        scoreMultiplier: 1.0,
        autoSave: true,
        difficulty: 'medium',
      };
      await gameEngine.initializeGame(config);
    });

    it('', () => {
      const state = gameEngine.getCurrentState();

      expect(state).toBeDefined();
      expect(state.id).toBeTruthy();
      expect(state.health).toBe(100);
      expect(state.level).toBe(1);
      expect(state.score).toBe(0);
    });

    it('', async () => {
      const input = {
        type: 'keyboard' as const,
        action: 'keydown',
        data: { key: 'w', code: 'KeyW' },
        timestamp: new Date(),
      };

      // Note
      await expect(gameEngine.handleInput(input)).resolves.toBeUndefined();
    });
  });

  describe('', () => {
    let initialState: GameState;

    beforeEach(async () => {
      const config: GameConfig = {
        maxLevel: 50,
        initialHealth: 100,
        scoreMultiplier: 1.0,
        autoSave: true,
        difficulty: 'medium',
      };
      initialState = await gameEngine.initializeGame(config);
    });

    it('', async () => {
      const saveId = await gameEngine.saveGame();

      expect(saveId).toBeTruthy();
      expect(typeof saveId).toBe('string');
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('', async () => {
      // Note
      const saveId = await gameEngine.saveGame();

      // GameStateManager
      const calculateChecksum = (state: any): string => {
        const stateStr = JSON.stringify(state, Object.keys(state).sort());
        let hash = 0;
        for (let i = 0; i < stateStr.length; i++) {
          const char = stateStr.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // 32
        }
        return hash.toString(16);
      };

      const correctChecksum = calculateChecksum(initialState);

      // Note
      const saveData = {
        id: saveId,
        state: initialState,
        config: {
          maxLevel: 50,
          initialHealth: 100,
          scoreMultiplier: 1.0,
          autoSave: true,
          difficulty: 'medium',
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          checksum: correctChecksum,
        },
      };

      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(saveData));

      // Note
      const loadedState = await gameEngine.loadGame(saveId);

      expect(loadedState).toBeDefined();
      expect(loadedState.id).toBe(initialState.id);
      expect(loadedState.health).toBe(initialState.health);
    });

    it('', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      await expect(gameEngine.loadGame('nonexistent')).rejects.toThrow();
    });
  });

  describe('', () => {
    beforeEach(async () => {
      const config: GameConfig = {
        maxLevel: 50,
        initialHealth: 100,
        scoreMultiplier: 1.0,
        autoSave: true,
        difficulty: 'medium',
      };
      await gameEngine.initializeGame(config);
    });

    it('', done => {
      const eventHandler = vi.fn(event => {
        expect(event).toBeDefined();
        expect(event.type).toBeTruthy();
        expect(event.source).toBeTruthy();
        done();
      });

      gameEngine.onGameEvent(eventHandler);

      // Note
      gameEngine.handleInput({
        type: 'keyboard',
        action: 'keydown',
        data: { key: 'test' },
        timestamp: new Date(),
      });
    });

    it('', async () => {
      const eventHandler = vi.fn();

      gameEngine.onGameEvent(eventHandler);
      gameEngine.offGameEvent(eventHandler);

      await gameEngine.handleInput({
        type: 'keyboard',
        action: 'keydown',
        data: { key: 'test' },
        timestamp: new Date(),
      });

      // Note
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('', () => {
    beforeEach(async () => {
      const config: GameConfig = {
        maxLevel: 50,
        initialHealth: 100,
        scoreMultiplier: 1.0,
        autoSave: true,
        difficulty: 'medium',
      };
      await gameEngine.initializeGame(config);
    });

    it('', async () => {
      const state = await gameEngine.startGame();

      expect(state).toBeDefined();
      expect(state.timestamp).toBeInstanceOf(Date);
    }, 30000); // 30s

    it('', async () => {
      await gameEngine.startGame();

      await gameEngine.pauseGame();
      expect(gameEngine.getStateMachineState()).toBe('paused');

      await gameEngine.resumeGame();
      expect(gameEngine.getStateMachineState()).toBe('running');
    }, 30000); // 30s

    it('', async () => {
      await gameEngine.startGame();

      // Note
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await gameEngine.endGame();

      expect(result).toBeDefined();
      expect(result.finalScore).toBe(0);
      expect(result.levelReached).toBe(1);
      expect(result.playTime).toBeGreaterThanOrEqual(0);
      expect(result.statistics).toBeDefined();
    }, 30000); // 30s
  });

  describe('', () => {
    it('', async () => {
      const engineWithoutContainer = new GameEngineAdapter();

      const config: GameConfig = {
        maxLevel: 50,
        initialHealth: 100,
        scoreMultiplier: 1.0,
        autoSave: true,
        difficulty: 'medium',
      };

      await engineWithoutContainer.initializeGame(config);

      await expect(engineWithoutContainer.startGame()).rejects.toThrow(
        'Game container not set'
      );

      engineWithoutContainer.destroy();
    });

    it('', async () => {
      await expect(gameEngine.saveGame()).rejects.toThrow(
        'No game state to save'
      );
    });
  });
});
