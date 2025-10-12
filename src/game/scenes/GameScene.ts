/**
 * GameScene: demo gameplay, UI and input
 * Loads textures, sets up player, UI, input, and physics
 */

// Phaser typings only (no runtime import)
import type * as Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import type { GameState, GameInput } from '../../ports/game-engine.port';
import { EventUtils } from '../../shared/contracts/events';
import {
  setupTexturePipeline,
  DEFAULT_TEXTURES,
} from '../assets/texture-pipeline';

export class GameScene extends BaseScene {
  private gameState: Partial<GameState> = {
    level: 1,
    score: 0,
    health: 100,
    inventory: [],
    position: { x: 400, y: 300 },
    timestamp: new Date(),
  };

  private player?: Phaser.GameObjects.Graphics;
  private ui?: {
    scoreText?: Phaser.GameObjects.Text;
    healthText?: Phaser.GameObjects.Text;
    levelText?: Phaser.GameObjects.Text;
  };

  constructor() {
    super({ key: 'GameScene' });
    this.ui = {};
  }

  /**
   * Preload textures and assets
   */
  preload(): void {
    // /atlas DEFAULT_TEXTURES
    // @ts-ignore - Phaser loader API
    setupTexturePipeline(this.load as any, DEFAULT_TEXTURES);
    // Embed tiny player placeholder sprite
    this.load.image(
      'player',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    );

    // Forward loading progress to event bus
    this.load.on('progress', (progress: number) => {
      this.publishEvent(
        EventUtils.createEvent({
          type: 'game.loading.progress',
          source: 'game-scene',
          data: { progress },
          id: `loading-${Date.now()}`,
        })
      );
    });
  }

  /**
   * Setup scene graph and subsystems
   */
  initializeScene(): void {
    this.setupBackground();
    this.setupPlayer();
    this.setupUI();
    this.setupInput();
    this.setupPhysics();

    // Announce scene initialization
    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.scene.initialized',
        source: 'game-scene',
        data: { scene: 'GameScene' },
        id: `scene-init-${Date.now()}`,
      })
    );
  }

  /**
   * Draw simple grid background
   */
  private setupBackground(): void {
    this.cameras.main.setBackgroundColor('#1a202c');

    // Draw grid lines
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.5);

    const gridSize = 50;
    for (let x = 0; x < this.scale.width; x += gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, this.scale.height);
    }
    for (let y = 0; y < this.scale.height; y += gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(this.scale.width, y);
    }
    graphics.strokePath();
  }

  /**
   * Initialize player entity
   */
  private setupPlayer(): void {
    const pos = this.gameState.position!;

    this.player = this.add.graphics();
    this.player.fillStyle(0x3182ce, 1);
    this.player.fillCircle(0, 0, 20);
    this.player.x = pos.x;
    this.player.y = pos.y;

    // Enable Arcade physics body for player
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(
      true
    );
  }

  /**
   * Initialize UI overlays
   */
  private setupUI(): void {
    const padding = 20;

    this.ui!.scoreText = this.add.text(
      padding,
      padding,
      `: ${this.gameState.score}`,
      {
        font: '18px Arial',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      }
    );

    this.ui!.healthText = this.add.text(
      padding,
      padding + 30,
      `: ${this.gameState.health}`,
      {
        font: '18px Arial',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      }
    );

    this.ui!.levelText = this.add.text(
      padding,
      padding + 60,
      `: ${this.gameState.level}`,
      {
        font: '18px Arial',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      }
    );

    // Ensure UI text overlays render on top
    this.ui!.scoreText.setDepth(100);
    this.ui!.healthText.setDepth(100);
    this.ui!.levelText.setDepth(100);
  }

  /**
   * Bind input listeners
   */
  private setupInput(): void {
    // Create keyboard cursors and WASD maps
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,S,A,D');

    // Forward pointer clicks as input events
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleInput({
        type: 'mouse',
        action: 'click',
        data: { x: pointer.x, y: pointer.y, button: pointer.button },
        timestamp: new Date(),
      });
    });

    // Forward keydown events
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      this.handleInput({
        type: 'keyboard',
        action: 'keydown',
        data: { key: event.key, code: event.code },
        timestamp: new Date(),
      });
    });

    // Expose references for update loop
    (this as any).cursors = cursors;
    (this as any).wasd = wasd;
  }

  /**
   * Setup physics boundaries
   */
  private setupPhysics(): void {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
  }

  /**
   * Game input
   */
  handleInput(input: GameInput): void {
    if (!this.player) return;

    const speed = 200;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    switch (input.action) {
      case 'click':
        if (input.type === 'mouse') {
          const targetX = input.data.x as number;
          const targetY = input.data.y as number;

          // Tween player to target position
          this.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: 500,
            ease: 'Power2',
          });

          // Update local state with new position
          this.setGameState({ position: { x: targetX, y: targetY } });
        }
        break;

      case 'keydown':
        if (input.type === 'keyboard') {
          const key = input.data.key as string;

          switch (key.toLowerCase()) {
            case 'w':
            case 'arrowup':
              body.setVelocityY(-speed);
              break;
            case 's':
            case 'arrowdown':
              body.setVelocityY(speed);
              break;
            case 'a':
            case 'arrowleft':
              body.setVelocityX(-speed);
              break;
            case 'd':
            case 'arrowright':
              body.setVelocityX(speed);
              break;
            case ' ':
              // Pause game
              this.scene.pause();
              this.publishEvent(
                EventUtils.createEvent({
                  type: 'game.state.paused',
                  source: 'game-scene',
                  data: { reason: 'user_input' },
                  id: `pause-${Date.now()}`,
                })
              );
              break;
          }
        }
        break;
    }

    // Emit processed input event
    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.input.processed',
        source: 'game-scene',
        data: { input },
        id: `input-${Date.now()}`,
      })
    );
  }

  /**
   * Per-frame scene update
   */
  updateScene(time: number, delta: number): void {
    if (!this.player) return;

    // Push latest player position into local state
    this.setGameState({
      position: {
        x: this.player.x,
        y: this.player.y,
      },
      timestamp: new Date(),
    });

    // Read inputs and update velocity
    const cursors = (this as any).cursors;
    const wasd = (this as any).wasd;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (cursors || wasd) {
      let velocityX = 0;
      let velocityY = 0;

      if (cursors.left.isDown || wasd.A.isDown) {
        velocityX = -200;
      } else if (cursors.right.isDown || wasd.D.isDown) {
        velocityX = 200;
      }

      if (cursors.up.isDown || wasd.W.isDown) {
        velocityY = -200;
      } else if (cursors.down.isDown || wasd.S.isDown) {
        velocityY = 200;
      }

      body.setVelocity(velocityX, velocityY);
    }

    // Emit periodic state update
    if (time % 1000 < delta) {
      this.publishEvent(
        EventUtils.createEvent({
          type: 'game.state.updated',
          source: 'game-scene',
          data: { gameState: this.gameState },
          id: `state-update-${Date.now()}`,
        })
      );
    }
  }

  /**
   * Get current game state
   */
  getGameState(): Partial<GameState> {
    return { ...this.gameState };
  }

  /**
   * Merge and propagate state changes
   */
  setGameState(newState: Partial<GameState>): void {
    this.gameState = { ...this.gameState, ...newState };

    // Update UI overlays if present
    if (this.ui!.scoreText && newState.score !== undefined) {
      this.ui!.scoreText.setText(`: ${newState.score}`);
    }
    if (this.ui!.healthText && newState.health !== undefined) {
      this.ui!.healthText.setText(`: ${newState.health}`);
    }
    if (this.ui!.levelText && newState.level !== undefined) {
      this.ui!.levelText.setText(`: ${newState.level}`);
    }

    // Note
    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.state.changed',
        source: 'game-scene',
        data: { gameState: this.gameState },
        id: `state-change-${Date.now()}`,
      })
    );
  }
}
