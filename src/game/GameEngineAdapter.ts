/**
 *  - GameEnginePort
 * Phaser
 */

import { SceneManager } from './SceneManager';
import { GameStateManager } from './state/GameStateManager';
import { StateSynchronizer } from './state/StateSynchronizer';
import type {
  GameEnginePort,
  GameState,
  GameConfig,
  GameInput,
  GameResult,
  GameStatistics,
} from '../ports/game-engine.port';
import type { DomainEvent } from '../shared/contracts/events';
import { EventUtils } from '../shared/contracts/events';
import type { GameDomainEvent } from '../shared/contracts/events/GameEvents';
import { globalEventBus } from '../hooks/useGameEvents';
import { EventPriority } from '../shared/contracts/events/GameEvents';
import { GameLoop } from '../runtime/loop';
import { StateMachine, type AppState } from '../runtime/state';

export class GameEngineAdapter implements GameEnginePort {
  private sceneManager: SceneManager;
  private gameLoop: GameLoop;
  private stateMachine: StateMachine;
  private stateManager: GameStateManager;
  private stateSynchronizer: StateSynchronizer;
  private eventCallbacks: Set<(event: DomainEvent) => void> = new Set();
  private eventBusSubscriptions: string[] = []; // EventBusID
  private currentConfig?: GameConfig;
  private currentState: GameState;
  private container?: HTMLElement;
  private gameStartTime: number = 0;
  private gameStatistics: GameStatistics = {
    totalMoves: 0,
    itemsCollected: 0,
    enemiesDefeated: 0,
    distanceTraveled: 0,
    averageReactionTime: 0,
  };

  constructor() {
    //
    this.stateMachine = new StateMachine();

    //
    this.stateManager = new GameStateManager({
      storageKey: 'guild-manager-game',
      maxSaves: 10,
      autoSaveInterval: 30000,
      enableCompression: true,
    });

    //
    this.stateSynchronizer = new StateSynchronizer({
      syncInterval: 1000,
      conflictResolution: 'priority',
      enableBidirectionalSync: true,
    });

    //
    this.sceneManager = new SceneManager({
      onEvent: (event: DomainEvent) => {
        this.handleDomainEvent(event);
      },
      onError: (error: Error, scene) => {
        console.error('Game engine error:', error, scene);
        this.stateMachine.transition('error');
      },
    });

    //
    this.gameLoop = new GameLoop(
      (delta: number) => this.updateGame(delta),
      (error: unknown) => {
        console.error('Game loop error:', error);
        this.stateMachine.transition('error');
      }
    );

    //
    this.currentState = {
      id: `game-${Date.now()}`,
      level: 1,
      score: 0,
      health: 100,
      inventory: [],
      position: { x: 400, y: 300 },
      timestamp: new Date(),
    };

    //
    this.stateManager.onEvent(event => this.handleDomainEvent(event));
    this.stateSynchronizer.onEvent(event => this.handleDomainEvent(event));

    // React
    this.setupEventBusListeners();

    //
    this.stateSynchronizer.registerSource(
      {
        id: 'game-engine',
        getState: () => this.currentState,
        setState: (state: GameState) => {
          this.currentState = { ...state };
          this.stateManager.setState(state, this.currentConfig);
        },
      },
      10
    ); //

    //
    this.stateSynchronizer.startSync();
  }

  /**
   *
   */
  async initializeGame(config: GameConfig): Promise<GameState> {
    try {
      this.stateMachine.transition('loading');
      this.currentConfig = config;

      //
      this.currentState = {
        id: `game-${Date.now()}`,
        level: 1,
        score: 0,
        health: config.initialHealth,
        inventory: [],
        position: { x: 400, y: 300 },
        timestamp: new Date(),
      };

      //
      this.gameStatistics = {
        totalMoves: 0,
        itemsCollected: 0,
        enemiesDefeated: 0,
        distanceTraveled: 0,
        averageReactionTime: 0,
      };

      //
      this.publishEvent(
        EventUtils.createEvent({
          type: 'game.engine.initialized',
          source: '/vitegame/game-engine',
          data: { config },
        })
      );

      this.stateMachine.transition('running');
      return this.currentState;
    } catch (error) {
      this.stateMachine.transition('error');
      throw error;
    }
  }

  /**
   *
   */
  async startGame(saveId?: string): Promise<GameState> {
    if (!this.container) {
      throw new Error('Game container not set. Call setContainer() first.');
    }

    try {
      // ID,
      if (saveId) {
        await this.loadGame(saveId);
      }

      //
      if (!this.sceneManager.isInitialized()) {
        await this.sceneManager.initialize(this.container, 800, 600);

        // TestScene
        console.log(' GameEngineAdapter: TestScene');
        this.sceneManager.startTestScene();
      }

      //
      this.gameLoop.start();
      this.gameStartTime = Date.now();

      // ()
      if (this.stateMachine.current !== 'running') {
        this.stateMachine.transition('running');
      }

      //
      this.publishEvent(
        EventUtils.createEvent({
          type: 'game.engine.started',
          source: '/vitegame/game-engine',
          data: {
            saveId,
            state: this.currentState,
            timestamp: this.gameStartTime,
          },
          id: `start-${Date.now()}`,
        })
      );

      return this.currentState;
    } catch (error) {
      this.stateMachine.transition('error');
      throw error;
    }
  }

  /**
   *
   */
  async pauseGame(): Promise<void> {
    this.gameLoop.stop();
    this.sceneManager.pauseGame();

    // running
    if (this.stateMachine.current === 'running') {
      this.stateMachine.transition('paused');
    }

    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.engine.paused',
        source: '/vitegame/game-engine',
        data: { state: this.currentState },
        id: `pause-${Date.now()}`,
      })
    );
  }

  /**
   *
   */
  async resumeGame(): Promise<void> {
    this.gameLoop.start();
    this.sceneManager.resumeGame();

    // pausedrunning
    if (this.stateMachine.current === 'paused') {
      this.stateMachine.transition('running');
    }

    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.engine.resumed',
        source: '/vitegame/game-engine',
        data: { state: this.currentState },
        id: `resume-${Date.now()}`,
      })
    );
  }

  /**
   *
   */
  async saveGame(): Promise<string> {
    if (!this.currentState || !this.currentConfig) {
      throw new Error('No game state to save');
    }

    //
    this.stateManager.setState(this.currentState, this.currentConfig);

    //
    const saveId = await this.stateManager.saveGame();

    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.save.completed',
        source: 'game-engine-adapter',
        data: { saveId },
        id: `save-${Date.now()}`,
      })
    );

    return saveId;
  }

  /**
   *
   */
  async loadGame(saveId: string): Promise<GameState> {
    try {
      //
      const { state, config } = await this.stateManager.loadGame(saveId);

      this.currentState = state;
      this.currentConfig = config;

      //
      this.stateSynchronizer.forceState(state);

      //
      this.sceneManager.setGameState(this.currentState);

      this.publishEvent(
        EventUtils.createEvent({
          type: 'game.save.loaded',
          source: 'game-engine-adapter',
          data: { saveId, state: this.currentState },
          id: `load-${Date.now()}`,
        })
      );

      return this.currentState;
    } catch (error) {
      this.publishEvent(
        EventUtils.createEvent({
          type: 'game.save.load_failed',
          source: 'game-engine-adapter',
          data: { saveId, error: (error as Error).message },
          id: `load-error-${Date.now()}`,
        })
      );
      throw error;
    }
  }

  /**
   *
   */
  async handleInput(input: GameInput): Promise<void> {
    console.log(
      ' GameEngineAdapter.handleInput:',
      input.type,
      input.action,
      input.data
    );
    //
    this.gameStatistics.totalMoves++;

    // ()
    const reactionTime = Date.now() - input.timestamp.getTime();
    this.gameStatistics.averageReactionTime =
      (this.gameStatistics.averageReactionTime + reactionTime) / 2;

    //
    const currentScene = this.sceneManager.getCurrentScene();
    if (currentScene && 'handleInput' in currentScene) {
      (currentScene as any).handleInput(input);
    }

    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.input.received',
        source: 'game-engine-adapter',
        data: { input },
        id: `input-${Date.now()}`,
      })
    );
  }

  /**
   *
   */
  getCurrentState(): GameState {
    //
    const sceneState = this.sceneManager.getGameState();
    if (sceneState) {
      this.currentState = { ...this.currentState, ...sceneState };
    }

    return { ...this.currentState };
  }

  /**
   *
   */
  onGameEvent(callback: (event: DomainEvent) => void): void {
    this.eventCallbacks.add(callback);
  }

  /**
   *
   */
  offGameEvent(callback: (event: DomainEvent) => void): void {
    this.eventCallbacks.delete(callback);
  }

  /**
   *
   */
  async endGame(): Promise<GameResult> {
    this.gameLoop.stop();

    const playTime =
      this.gameStartTime > 0 ? Date.now() - this.gameStartTime : 0;

    const result: GameResult = {
      finalScore: this.currentState.score,
      levelReached: this.currentState.level,
      playTime,
      achievements: [], // TODO:
      statistics: this.gameStatistics,
    };

    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.session.ended',
        source: 'game-engine-adapter',
        data: { result },
        id: `end-${Date.now()}`,
      })
    );

    return result;
  }

  /**
   *
   */
  setContainer(container: HTMLElement): void {
    this.container = container;
  }

  /**
   *
   */
  getStateMachineState(): AppState {
    return this.stateMachine.current;
  }

  /**
   *
   */
  private async updateGame(_delta: number): Promise<void> {
    try {
      //
      this.currentState = { ...this.currentState, timestamp: new Date() };

      // ()
      if (this.sceneManager.isInitialized()) {
        const sceneState = this.sceneManager.getGameState();
        if (sceneState) {
          //
          const oldPos = this.currentState.position;
          const newPos = sceneState.position;
          if (oldPos && newPos) {
            const distance = Math.sqrt(
              Math.pow(newPos.x - oldPos.x, 2) +
                Math.pow(newPos.y - oldPos.y, 2)
            );
            this.gameStatistics.distanceTraveled += distance;
          }

          this.currentState = { ...this.currentState, ...sceneState };
        }
      }
    } catch (error) {
      console.warn('Error in updateGame:', error);
      // ,updateGame
      //
    }
  }

  /**
   *
   */
  private handleDomainEvent(event: DomainEvent): void {
    console.log(' GameEngineAdapter.handleDomainEvent:', event.type, event);

    //
    console.log(' ', this.eventCallbacks.size, '');
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  /**
   *
   */
  private publishEvent(event: DomainEvent): void {
    this.handleDomainEvent(event);
  }

  /**
   * EventBus
   */
  private publishGameEvent(event: GameDomainEvent): void {
    globalEventBus.publish(event, {
      source: 'phaser-engine',
      priority: EventPriority.NORMAL,
    });
  }

  /**
   * EventBus
   */
  private setupEventBusListeners(): void {
    // React
    const pauseSubId = globalEventBus.subscribe(
      'react.command.pause',
      async event => {
        console.log('Received pause command from React:', event);
        await this.pauseGame();
        this.publishGameEvent({
          type: 'phaser.response.completed',
          data: { command: 'pause', timestamp: new Date() },
        });
      },
      { context: 'phaser-adapter', priority: EventPriority.HIGH }
    );

    const resumeSubId = globalEventBus.subscribe(
      'react.command.resume',
      async event => {
        console.log('Received resume command from React:', event);
        await this.resumeGame();
        this.publishGameEvent({
          type: 'phaser.response.completed',
          data: { command: 'resume', timestamp: new Date() },
        });
      },
      { context: 'phaser-adapter', priority: EventPriority.HIGH }
    );

    const saveSubId = globalEventBus.subscribe(
      'react.command.save',
      async event => {
        console.log('Received save command from React:', event);
        try {
          const saveId = await this.saveGame();
          this.publishGameEvent({
            type: 'phaser.response.completed',
            data: {
              command: 'save',
              result: { saveId },
              timestamp: new Date(),
            },
          });
        } catch (error) {
          this.publishGameEvent({
            type: 'game.error',
            data: {
              error: (error as Error).message,
              context: 'save-command',
              timestamp: new Date(),
            },
          });
        }
      },
      { context: 'phaser-adapter', priority: EventPriority.HIGH }
    );

    const loadSubId = globalEventBus.subscribe(
      'react.command.load',
      async event => {
        console.log('Received load command from React:', event);
        try {
          if (
            !event.data ||
            typeof event.data !== 'object' ||
            !('saveId' in event.data)
          ) {
            throw new Error('Invalid load command: missing saveId');
          }
          const saveId = (event.data as any).saveId;
          const gameState = await this.loadGame(saveId);
          this.publishGameEvent({
            type: 'phaser.response.completed',
            data: {
              command: 'load',
              result: { gameState },
              timestamp: new Date(),
            },
          });
        } catch (error) {
          this.publishGameEvent({
            type: 'game.error',
            data: {
              error: (error as Error).message,
              context: 'load-command',
              timestamp: new Date(),
            },
          });
        }
      },
      { context: 'phaser-adapter', priority: EventPriority.HIGH }
    );

    const restartSubId = globalEventBus.subscribe(
      'react.command.restart',
      async event => {
        console.log('Received restart command from React:', event);
        try {
          await this.endGame();
          if (this.currentConfig) {
            const newGameState = await this.initializeGame(this.currentConfig);
            await this.startGame();
            this.publishGameEvent({
              type: 'phaser.response.completed',
              data: {
                command: 'restart',
                result: { gameState: newGameState },
                timestamp: new Date(),
              },
            });
          }
        } catch (error) {
          this.publishGameEvent({
            type: 'game.error',
            data: {
              error: (error as Error).message,
              context: 'restart-command',
              timestamp: new Date(),
            },
          });
        }
      },
      { context: 'phaser-adapter', priority: EventPriority.HIGH }
    );

    // ID
    this.eventBusSubscriptions.push(
      pauseSubId,
      resumeSubId,
      saveSubId,
      loadSubId,
      restartSubId
    );

    // Phaser
    this.publishGameEvent({
      type: 'phaser.response.ready',
      data: { timestamp: new Date() },
    });
  }

  /**
   * EventBusReact
   */

  /**
   * EventBus
   */
  private publishDomainEventToEventBus(event: DomainEvent): void {
    // DomainEventGameDomainEvent
    let gameEvent: GameDomainEvent | null = null;

    switch (event.type) {
      case 'game.state.manager.updated':
        gameEvent = {
          type: 'game.state.updated',
          data: {
            gameState:
              event.data &&
              typeof event.data === 'object' &&
              'state' in event.data
                ? (event.data as any).state
                : {},
            timestamp: new Date(),
          },
        };
        break;

      case 'game.save.created':
        gameEvent = {
          type: 'game.save.created',
          data: {
            saveId:
              event.data &&
              typeof event.data === 'object' &&
              'saveId' in event.data
                ? (event.data as any).saveId
                : '',
            gameState:
              event.data &&
              typeof event.data === 'object' &&
              'state' in event.data
                ? (event.data as any).state
                : {},
          },
        };
        break;

      case 'game.save.loaded':
        gameEvent = {
          type: 'game.save.loaded',
          data: {
            saveId:
              event.data &&
              typeof event.data === 'object' &&
              'saveId' in event.data
                ? (event.data as any).saveId
                : '',
            gameState:
              event.data &&
              typeof event.data === 'object' &&
              'state' in event.data
                ? (event.data as any).state
                : {},
          },
        };
        break;

      case 'game.autosave.completed':
        gameEvent = {
          type: 'game.autosave.completed',
          data: {
            saveId:
              event.data &&
              typeof event.data === 'object' &&
              'saveId' in event.data
                ? (event.data as any).saveId
                : '',
            timestamp: new Date(),
          },
        };
        break;
    }

    //
    if (gameEvent) {
      globalEventBus.publish(gameEvent, {
        source: 'phaser-adapter',
        priority: EventPriority.NORMAL,
      });
    }
  }

  /**
   *
   */
  destroy(): void {
    // EventBus
    this.eventBusSubscriptions.forEach(subId => {
      globalEventBus.unsubscribe(subId);
    });
    this.eventBusSubscriptions = [];

    //
    this.gameLoop.stop();
    this.sceneManager.destroy();
    this.stateManager.destroy();
    this.stateSynchronizer.destroy();
    this.eventCallbacks.clear();
  }
}
