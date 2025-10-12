/**
 * SceneManager: orchestrates Phaser scenes and domain event bridging
 */

// phaser initialize()
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { TestScene } from './scenes/TestScene';
import type { DomainEvent } from '../shared/contracts/events';

export type SceneKey = 'MenuScene' | 'GameScene' | 'TestScene';

export interface SceneManagerConfig {
  onEvent?: (event: DomainEvent) => void;
  onError?: (error: Error, scene?: SceneKey) => void;
}

export class SceneManager {
  private game: any | null = null;
  private phaser: any | null = null;
  private config: SceneManagerConfig;
  private eventCallback?: (event: DomainEvent) => void;

  constructor(config: SceneManagerConfig = {}) {
    this.config = config;
    this.eventCallback = config.onEvent;
  }

  /**
   * Initialize Phaser game and scenes, attach handlers
   */
  async initialize(
    container: HTMLElement,
    width: number = 800,
    height: number = 600
  ): Promise<void> {
    try {
      const PhaserMod = (await import('phaser')).default as any;
      this.phaser = PhaserMod;
      // Expose Phaser globally for BaseScene bridge
      (globalThis as any).Phaser = PhaserMod;

      return new Promise<void>(resolve => {
        const gameConfig: any = {
          type: PhaserMod.AUTO,
          width,
          height,
          parent: container,
          backgroundColor: '#1a202c',
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          scale: {
            mode: PhaserMod.Scale.FIT,
            autoCenter: PhaserMod.Scale.CENTER_BOTH,
            min: {
              width: 400,
              height: 300,
            },
            max: {
              width: 1600,
              height: 1200,
            },
          },
          scene: [MenuScene, GameScene, TestScene],
          callbacks: {
            postBoot: () => {
              this.setupEventHandlers();
              resolve();
            },
          },
        };

        this.game = new PhaserMod.Game(gameConfig);
      });
    } catch (error) {
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Hook top-level game events and hot-rebind scene listeners
   */
  private setupEventHandlers(): void {
    if (!this.game) return;

    // Forward domain events from game root
    this.game.events.on('domain-event', (event: DomainEvent) => {
      this.handleDomainEvent(event);
    });

    // Bind listeners for each named scene
    this.setupSceneEventListeners();

    // Rebind after a short delay to catch late-attached scenes
    setTimeout(() => {
      console.log('[SceneManager] rebinding scene listeners');
      this.setupSceneEventListeners();
    }, 500);
  }

  /**
   * Bind a domain-event listener for a specific scene
   */
  private setupListenerForScene(scene: any): void {
    const sceneKey = scene.scene.key;
    console.log(`[SceneManager] bind scene ${sceneKey}`);

    // Ensure no duplicate handlers remain
    scene.events.off('domain-event');

    scene.events.on('domain-event', (event: DomainEvent) => {
      console.log(`[SceneManager] ${sceneKey}:`, event.type);
      console.log(`[SceneManager] eventCallback:`, !!this.eventCallback);
      this.eventCallback?.(event);
      console.log(`[SceneManager] dispatched to eventCallback`);
    });
  }

  /**
   * Iterate all scenes and (re)bind listeners
   */
  private setupSceneEventListeners(): void {
    if (!this.game) return;

    const sceneManager = this.game.scene;

    ['MenuScene', 'GameScene', 'TestScene'].forEach(sceneKey => {
      const scene = sceneManager.getScene(sceneKey);
      if (scene) {
        this.setupListenerForScene(scene);
      } else {
        console.warn(`[SceneManager] scene missing: ${sceneKey}`);
      }
    });
  }

  /**
   * Handle incoming domain events at manager level
   */
  private handleDomainEvent(event: DomainEvent): void {
    console.log('[SceneManager] Domain Event:', event);

    // Dispatch to specific handlers
    switch (event.type) {
      case 'game.menu.action':
        this.handleMenuAction(event);
        break;

      case 'game.state.paused':
        this.handleGamePaused(event);
        break;

      case 'game.exit.requested':
        this.handleExitRequested(event);
        break;

      case 'game.error':
        this.handleGameError(event);
        break;
    }

    // Forward events
    this.eventCallback?.(event);
  }

  /**
   * Handle menu actions from UI
   */
  private handleMenuAction(event: DomainEvent): void {
    const { action } = event.data as { action: string };

    switch (action) {
      case 'start-game':
        this.startGame();
        break;
      case 'exit':
        this.exitGame();
        break;
    }
  }

  /**
   * Handle game paused events
   */
  private handleGamePaused(event: DomainEvent): void {
    // Save game state
    console.log('Game paused:', event.data);
  }

  /**
   * Handle exit requests
   */
  private handleExitRequested(_event: DomainEvent): void {
    this.exitGame();
  }

  /**
   * Handle error events by delegating to config.onError
   */
  private handleGameError(event: DomainEvent): void {
    const errorData = event.data as { error: string; scene?: string };
    this.config.onError?.(
      new Error(errorData.error),
      errorData.scene as SceneKey
    );
  }

  /**
   * Start main gameplay scene
   */
  startGame(): void {
    if (!this.game) return;
    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('scene_switch_triggered:GameScene');
      }
    } catch {
      /* noop */
    }

    const gameScene = this.game.scene.getScene('GameScene') as GameScene;
    if (gameScene) {
      this.game.scene.start('GameScene');
    }
  }

  /**
   * Pause game
   */
  pauseGame(): void {
    if (!this.game) return;

    const gameScene = this.game.scene.getScene('GameScene');
    if (gameScene && gameScene.scene.isActive()) {
      gameScene.scene.pause();
    }
  }

  /**
   * Resume game
   */
  resumeGame(): void {
    if (!this.game) return;

    const gameScene = this.game.scene.getScene('GameScene');
    if (gameScene && gameScene.scene.isPaused()) {
      gameScene.scene.resume();
    }
  }

  /**
   * Restart the gameplay scene
   */
  restartGame(): void {
    if (!this.game) return;

    this.game.scene.start('GameScene');
  }

  /**
   * Start test scene
   */
  startTestScene(): void {
    if (!this.game) return;
    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('scene_switch_triggered:TestScene');
      }
    } catch {
      /* noop */
    }

    console.log('[SceneManager] start TestScene');
    this.game.scene.start('TestScene');
  }

  /**
   * Return to menu scene
   */
  returnToMenu(): void {
    if (!this.game) return;
    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('scene_switch_triggered:MenuScene');
      }
    } catch {
      /* noop */
    }

    this.game.scene.start('MenuScene');
  }

  /**
   * Destroy Phaser game instance
   */
  exitGame(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }

  /**
   * Get currently active scene (if any)
   */
  getCurrentScene(): any | null {
    if (!this.game) return null;

    const scenes = this.game.scene.getScenes(true);
    return scenes.length > 0 ? scenes[0] : null;
  }

  /**
   * Read current game state from GameScene if active
   */
  getGameState(): any {
    if (!this.game) return null;

    const gameScene = this.game.scene.getScene('GameScene') as GameScene;
    if (gameScene && gameScene.scene.isActive()) {
      return gameScene.getGameState();
    }

    return null;
  }

  /**
   * Write new state into GameScene if active
   */
  setGameState(state: any): void {
    if (!this.game) return;

    const gameScene = this.game.scene.getScene('GameScene') as GameScene;
    if (gameScene && gameScene.scene.isActive()) {
      gameScene.setGameState(state);
    }
  }

  /**
   * Whether the manager initialized the Phaser game
   */
  isInitialized(): boolean {
    return this.game !== null;
  }

  /**
   * Tear down manager and detach callback
   */
  destroy(): void {
    this.exitGame();
    this.eventCallback = undefined;
  }
}
