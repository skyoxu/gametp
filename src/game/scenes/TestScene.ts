/**
 *  -
 * :  level.complete
 */

// Phaser typings only (no runtime import)
import type * as Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import type { GameState, GameInput } from '../../ports/game-engine.port';
import type { GameDomainEvent } from '../../shared/contracts/events/GameEvents';
import { EventUtils } from '../../shared/contracts/events';
import {
  setupTexturePipeline,
  DEFAULT_TEXTURES,
} from '../assets/texture-pipeline';

interface TestSceneState {
  playerPosition: { x: number; y: number };
  totalMoves: number;
  startTime: Date;
  levelCompleted: boolean;
}

export class TestScene extends BaseScene {
  private testState: TestSceneState = {
    playerPosition: { x: 400, y: 300 },
    totalMoves: 0,
    startTime: new Date(),
    levelCompleted: false,
  };

  private player?: Phaser.GameObjects.Graphics;
  private goalArea?: Phaser.GameObjects.Graphics;
  private ui?: {
    instructionText?: Phaser.GameObjects.Text;
    movesText?: Phaser.GameObjects.Text;
    statusText?: Phaser.GameObjects.Text;
  };

  constructor() {
    super({ key: 'TestScene' });
    this.ui = {};
  }

  /**
   *
   */
  preload(): void {
    // /atlas (, DEFAULT_TEXTURES)
    // @ts-ignore - Phaser  loader API
    setupTexturePipeline(this.load as any, DEFAULT_TEXTURES);

    //
    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.scene.started' as any,
        source: 'test-scene',
        data: { sceneKey: 'TestScene', timestamp: new Date() },
      })
    );
  }

  /**
   *
   */
  initializeScene(): void {
    this.setupBackground();
    this.setupPlayer();
    this.setupGoalArea();
    this.setupUI();
    this.setupInput();

    //
    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.scene.created' as any,
        source: 'test-scene',
        data: { sceneKey: 'TestScene', timestamp: new Date() },
      })
    );
  }

  /**
   *
   */
  private setupBackground(): void {
    this.cameras.main.setBackgroundColor('#2d3748');

    //
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x4a5568, 0.3);

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
   * ()
   */
  private setupPlayer(): void {
    const pos = this.testState.playerPosition;

    this.player = this.add.graphics();
    this.player.fillStyle(0x3182ce, 1);
    this.player.fillCircle(0, 0, 25);
    this.player.x = pos.x;
    this.player.y = pos.y;

    //
    this.player.lineStyle(3, 0xffffff, 0.8);
    this.player.strokeCircle(0, 0, 25);
  }

  /**
   * (level.complete)
   */
  private setupGoalArea(): void {
    const goalX = 700;
    const goalY = 100;

    this.goalArea = this.add.graphics();
    this.goalArea.fillStyle(0x48bb78, 0.3);
    this.goalArea.fillRect(0, 0, 80, 80);
    this.goalArea.lineStyle(3, 0x48bb78, 1);
    this.goalArea.strokeRect(0, 0, 80, 80);
    this.goalArea.x = goalX;
    this.goalArea.y = goalY;

    //
    this.add.text(goalX + 10, goalY + 30, '', {
      font: '16px Arial',
      color: '#ffffff',
      backgroundColor: '#48bb78',
      padding: { x: 8, y: 4 },
    });
  }

  /**
   * UI
   */
  private setupUI(): void {
    const padding = 20;

    this.ui!.instructionText = this.add.text(padding, padding, 'WASD', {
      font: '18px Arial',
      color: '#ffffff',
      backgroundColor: '#2d3748',
      padding: { x: 15, y: 10 },
      wordWrap: { width: this.scale.width - 40 },
    });

    this.ui!.movesText = this.add.text(
      padding,
      padding + 50,
      `: ${this.testState.totalMoves}`,
      {
        font: '16px Arial',
        color: '#e2e8f0',
        backgroundColor: '#4a5568',
        padding: { x: 10, y: 5 },
      }
    );

    this.ui!.statusText = this.add.text(padding, padding + 80, ': ...', {
      font: '16px Arial',
      color: '#fbb6ce',
      backgroundColor: '#553c9a',
      padding: { x: 10, y: 5 },
    });

    // UI
    this.ui!.instructionText.setDepth(100);
    this.ui!.movesText.setDepth(100);
    this.ui!.statusText.setDepth(100);
  }

  /**
   *
   */
  private setupInput(): void {
    // WASD
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,S,A,D');

    //
    (this as any).cursors = cursors;
    (this as any).wasd = wasd;

    //
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (this.testState.levelCompleted) return;

      this.handleInput({
        type: 'keyboard',
        action: 'keydown',
        data: { key: event.key, code: event.code },
        timestamp: new Date(),
      });
    });

    // ()
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.testState.levelCompleted) return;

      this.handleInput({
        type: 'mouse',
        action: 'click',
        data: { x: pointer.x, y: pointer.y, button: pointer.button },
        timestamp: new Date(),
      });
    });
  }

  /**
   *
   */
  handleInput(input: GameInput): void {
    console.log(
      ' TestScene.handleInput:',
      input.type,
      input.action,
      input.data
    );
    if (!this.player || this.testState.levelCompleted) {
      console.log(
        ' TestScene.handleInput:  - player:',
        !!this.player,
        'completed:',
        this.testState.levelCompleted
      );
      return;
    }

    const speed = 50;
    let moved = false;
    let newX = this.player.x;
    let newY = this.player.y;

    switch (input.action) {
      case 'keydown':
        if (input.type === 'keyboard') {
          const key = input.data.key as string;

          switch (key.toLowerCase()) {
            case 'w':
            case 'arrowup':
              newY = Math.max(25, this.player.y - speed);
              moved = true;
              break;
            case 's':
            case 'arrowdown':
              newY = Math.min(this.scale.height - 25, this.player.y + speed);
              moved = true;
              break;
            case 'a':
            case 'arrowleft':
              newX = Math.max(25, this.player.x - speed);
              moved = true;
              break;
            case 'd':
            case 'arrowright':
              newX = Math.min(this.scale.width - 25, this.player.x + speed);
              moved = true;
              break;
            case ' ':
            case 'enter':
              // ()
              this.triggerLevelComplete('manual_trigger');
              return;
          }
        }
        break;

      case 'click':
        if (input.type === 'mouse') {
          const targetX = Math.max(
            25,
            Math.min(this.scale.width - 25, input.data.x as number)
          );
          const targetY = Math.max(
            25,
            Math.min(this.scale.height - 25, input.data.y as number)
          );

          newX = targetX;
          newY = targetY;
          moved = true;
        }
        break;
    }

    if (moved) {
      //
      this.player.x = newX;
      this.player.y = newY;

      //
      this.testState.playerPosition = { x: newX, y: newY };
      this.testState.totalMoves++;

      // UI
      this.updateUI();

      //
      this.publishEvent(
        EventUtils.createEvent({
          type: 'game.player.moved' as any,
          source: 'test-scene',
          data: {
            position: { x: newX, y: newY },
            timestamp: new Date(),
          },
        })
      );

      //
      this.checkGoalCollision();

      //
      this.publishEvent(
        EventUtils.createEvent({
          type: 'game.input.keyboard' as any,
          source: 'test-scene',
          data: {
            key: input.type === 'keyboard' ? input.data.key : 'click',
            action: 'keydown',
            timestamp: new Date(),
          },
        })
      );
    }
  }

  /**
   *
   */
  private checkGoalCollision(): void {
    if (!this.player || !this.goalArea || this.testState.levelCompleted) return;

    const playerBounds = {
      left: this.player.x - 25,
      right: this.player.x + 25,
      top: this.player.y - 25,
      bottom: this.player.y + 25,
    };

    const goalBounds = {
      left: this.goalArea.x,
      right: this.goalArea.x + 80,
      top: this.goalArea.y,
      bottom: this.goalArea.y + 80,
    };

    //
    if (
      playerBounds.right > goalBounds.left &&
      playerBounds.left < goalBounds.right &&
      playerBounds.bottom > goalBounds.top &&
      playerBounds.top < goalBounds.bottom
    ) {
      this.triggerLevelComplete('goal_reached');
    }
  }

  /**
   *
   */
  private triggerLevelComplete(reason: string): void {
    if (this.testState.levelCompleted) return;

    this.testState.levelCompleted = true;
    const endTime = new Date();
    const duration = endTime.getTime() - this.testState.startTime.getTime();

    //
    const score = Math.max(100 - this.testState.totalMoves, 10) * 10;

    const levelResult = {
      levelId: 'test-level-1',
      completed: true,
      score: score,
      totalMoves: this.testState.totalMoves,
      duration: duration,
      completionReason: reason,
      timestamp: endTime,
    };

    //  level.complete ()
    console.log(' TestScene.triggerLevelComplete:  game.level.completed ');
    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.level.completed',
        source: 'test-scene',
        data: {
          level: 1,
          result: {
            score: levelResult.score,
            totalMoves: levelResult.totalMoves,
            duration: levelResult.duration,
          },
          timestamp: endTime,
        },
      })
    );
    console.log(' TestScene.triggerLevelComplete: game.level.completed ');

    //
    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.player.scored',
        source: 'test-scene',
        data: {
          score: score,
          increment: score,
          timestamp: endTime,
        },
      })
    );

    // UI
    this.updateUI();

    //
    this.showCompletionEffects(levelResult);
  }

  /**
   *
   */
  private showCompletionEffects(result: any): void {
    if (!this.player) return;

    //
    this.player.clear();
    this.player.fillStyle(0xffd700, 1);
    this.player.fillCircle(0, 0, 30);
    this.player.lineStyle(3, 0xffffff, 1);
    this.player.strokeCircle(0, 0, 30);

    //
    const completionText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      ` !\n: ${result.score}\n: ${result.totalMoves}\n: ${Math.round(result.duration / 1000)}\n\nESC5`,
      {
        font: '24px Arial',
        color: '#ffffff',
        backgroundColor: '#2d3748',
        padding: { x: 20, y: 15 },
        align: 'center',
      }
    );
    completionText.setOrigin(0.5);
    completionText.setDepth(200);

    //
    this.tweens.add({
      targets: completionText,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 5
    this.time.delayedCall(5000, () => {
      this.triggerSceneEnd();
    });

    // ESC
    this.input.keyboard!.on('keydown-ESC', () => {
      this.triggerSceneEnd();
    });
  }

  /**
   *
   */
  private triggerSceneEnd(): void {
    //
    this.publishEvent(
      EventUtils.createEvent({
        type: 'game.scene.stopped' as any,
        source: 'test-scene',
        data: { sceneKey: 'TestScene', timestamp: new Date() },
      })
    );

    //
    // GameVerticalSlice
    this.events.emit('level-completed', this.testState);
  }

  /**
   * UI
   */
  private updateUI(): void {
    if (this.ui!.movesText) {
      this.ui!.movesText.setText(`: ${this.testState.totalMoves}`);
    }

    if (this.ui!.statusText) {
      if (this.testState.levelCompleted) {
        this.ui!.statusText.setText(': ! ');
        this.ui!.statusText.setStyle({ color: '#68d391' });
      } else {
        this.ui!.statusText.setText(': ...');
      }
    }
  }

  /**
   *
   */
  updateScene(time: number, delta: number): void {
    //
    // ()

    if (this.testState.levelCompleted) return;

    const cursors = (this as any).cursors;
    const wasd = (this as any).wasd;

    // ()
    if (cursors || wasd) {
      let moveX = 0;
      let moveY = 0;
      const smoothSpeed = 3;

      if (cursors.left.isDown || wasd.A.isDown) {
        moveX = -smoothSpeed;
      } else if (cursors.right.isDown || wasd.D.isDown) {
        moveX = smoothSpeed;
      }

      if (cursors.up.isDown || wasd.W.isDown) {
        moveY = -smoothSpeed;
      } else if (cursors.down.isDown || wasd.S.isDown) {
        moveY = smoothSpeed;
      }

      if (moveX !== 0 || moveY !== 0) {
        const newX = Math.max(
          25,
          Math.min(this.scale.width - 25, this.player!.x + moveX)
        );
        const newY = Math.max(
          25,
          Math.min(this.scale.height - 25, this.player!.y + moveY)
        );

        if (newX !== this.player!.x || newY !== this.player!.y) {
          this.player!.x = newX;
          this.player!.y = newY;
          this.testState.playerPosition = { x: newX, y: newY };

          // ()
          this.checkGoalCollision();
        }
      }
    }
  }

  /**
   * ()
   */
  getTestState(): TestSceneState {
    return { ...this.testState };
  }
}
