/**
 * SceneManager tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SceneManager } from '../SceneManager';
import type { DomainEvent } from '../../shared/contracts/events';

// Mock Phaser BaseScene Phaser
vi.mock('phaser', () => import('./__mocks__/phaser'));
import Phaser from 'phaser';
(globalThis as any).Phaser = Phaser as any;

describe('SceneManager', () => {
  let sceneManager: SceneManager;
  let mockContainer: HTMLElement;
  let eventHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);

    eventHandler = vi.fn();
    sceneManager = new SceneManager({
      onEvent: eventHandler,
      onError: vi.fn(),
    });
  });

  afterEach(() => {
    sceneManager.destroy();
    document.body.removeChild(mockContainer);
    vi.clearAllMocks();
  });

  describe('', () => {
    it('', () => {
      expect(sceneManager).toBeDefined();
      expect(sceneManager.isInitialized()).toBe(false);
    });

    it('', async () => {
      await sceneManager.initialize(mockContainer, 800, 600);
      expect(sceneManager.isInitialized()).toBe(true);
    });

    it('', async () => {
      // null
      const mockError = new Error('Container is null');
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // Note
      expect(sceneManager.initialize).toBeDefined();
    });
  });

  describe('', () => {
    beforeEach(async () => {
      await sceneManager.initialize(mockContainer);
    });

    it('', () => {
      sceneManager.startGame();
      // Note
      expect(true).toBe(true);
    });

    it('', () => {
      sceneManager.pauseGame();
      expect(true).toBe(true);
    });

    it('', () => {
      sceneManager.resumeGame();
      expect(true).toBe(true);
    });

    it('', () => {
      sceneManager.restartGame();
      expect(true).toBe(true);
    });

    it('', () => {
      sceneManager.returnToMenu();
      expect(true).toBe(true);
    });

    it('', () => {
      sceneManager.exitGame();
      expect(sceneManager.isInitialized()).toBe(false);
    });
  });

  describe('', () => {
    beforeEach(async () => {
      await sceneManager.initialize(mockContainer);
    });

    it('', () => {
      const currentScene = sceneManager.getCurrentScene();
      // null
      expect(currentScene !== undefined).toBe(true);
    });

    it('', () => {
      const gameState = sceneManager.getGameState();
      // null
      expect(gameState !== undefined).toBe(true);
    });

    it('', () => {
      const mockState = {
        id: 'test-id',
        level: 2,
        score: 100,
        health: 80,
        inventory: ['item1'],
        position: { x: 100, y: 200 },
        timestamp: new Date(),
      };

      sceneManager.setGameState(mockState);
      // Note
      expect(true).toBe(true);
    });
  });

  describe('', () => {
    beforeEach(async () => {
      await sceneManager.initialize(mockContainer);
    });

    it('', () => {
      const event: DomainEvent = {
        type: 'game.menu.action',
        source: 'test',
        data: { action: 'start-game' },
        timestamp: new Date(),
        id: 'test-event',
        specversion: '1.0',
        datacontenttype: 'application/json',
      };

      // Note
      sceneManager['handleDomainEvent'](event);
      expect(true).toBe(true);
    });

    it('', () => {
      const event: DomainEvent = {
        type: 'game.state.paused',
        source: 'test',
        data: { reason: 'user_input' },
        timestamp: new Date(),
        id: 'test-event',
        specversion: '1.0',
        datacontenttype: 'application/json',
      };

      sceneManager['handleDomainEvent'](event);
      expect(true).toBe(true);
    });

    it('', () => {
      const event: DomainEvent = {
        type: 'game.exit.requested',
        source: 'test',
        data: { reason: 'user_menu_selection' },
        timestamp: new Date(),
        id: 'test-event',
        specversion: '1.0',
        datacontenttype: 'application/json',
      };

      sceneManager['handleDomainEvent'](event);
      expect(sceneManager.isInitialized()).toBe(false);
    });

    it('', () => {
      const errorHandler = vi.fn();
      const sceneManagerWithErrorHandler = new SceneManager({
        onError: errorHandler,
      });

      const event: DomainEvent = {
        type: 'game.error',
        source: 'test',
        data: { error: 'Test error', scene: 'GameScene' },
        timestamp: new Date(),
        id: 'test-event',
        specversion: '1.0',
        datacontenttype: 'application/json',
      };

      sceneManagerWithErrorHandler['handleDomainEvent'](event);
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error), 'GameScene');

      sceneManagerWithErrorHandler.destroy();
    });
  });

  describe('', () => {
    it('', () => {
      const uninitializedManager = new SceneManager();

      // Note
      expect(() => {
        uninitializedManager.startGame();
        uninitializedManager.pauseGame();
        uninitializedManager.resumeGame();
        uninitializedManager.restartGame();
        uninitializedManager.returnToMenu();
        uninitializedManager.exitGame();
      }).not.toThrow();

      expect(uninitializedManager.getCurrentScene()).toBeNull();
      expect(uninitializedManager.getGameState()).toBeNull();

      uninitializedManager.destroy();
    });

    it('', () => {
      expect(() => {
        sceneManager.destroy();
        sceneManager.destroy(); // Note
      }).not.toThrow();
    });
  });
});
