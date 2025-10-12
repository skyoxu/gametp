/**
 * Base Phaser Scene abstraction
 * Bridges Phaser scenes with the domain event bus
 */

// Phaser typings only (no runtime import)
import type * as Phaser from 'phaser';
// Bridge to global Phaser.Scene installed by SceneManager.initialize
const PhaserSceneBase: any = (globalThis as any)?.Phaser?.Scene ?? class {};
import type { DomainEvent } from '../../shared/contracts/events';
import { globalEventBus } from '../../hooks/useGameEvents';

type SceneCallback = (...args: any[]) => void;

export abstract class BaseScene extends PhaserSceneBase {
  protected eventCallbacks: Map<string, SceneCallback[]> = new Map();

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  /**
   * Publish a domain event to Phaser and global event bus
   */
  protected publishEvent(event: DomainEvent): void {
    console.log('[BaseScene] publishEvent', event.type, event);

    // 1: Scene
    this.events.emit('domain-event', event);
    console.log('[BaseScene] domain-event emitted');

    // 2: SceneManager
    try {
      console.log('[BaseScene] publish to globalEventBus');
      // DomainEvent GameDomainEvent
      globalEventBus.publish(event as any, {
        id: `scene-direct-${Date.now()}`,
        timestamp: new Date(),
        source: 'base-scene-direct',
        priority: 'normal' as any,
      });
      console.log('[BaseScene] published to globalEventBus');
    } catch (error) {
      console.error('[BaseScene] globalEventBus publish error:', error);
    }
  }

  /**
   * Subscribe a local callback for a domain event type
   */
  protected subscribeEvent(
    eventType: string,
    callback: (...args: any[]) => void
  ): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }
    this.eventCallbacks.get(eventType)!.push(callback);
  }

  /**
   * Unsubscribe a local callback for a domain event type
   */
  protected unsubscribeEvent(
    eventType: string,
    callback: (...args: any[]) => void
  ): void {
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Release scene-local resources
   */
  destroy(): void {
    this.eventCallbacks.clear();
    // Note: Phaser.Scene doesn't have a destroy method, cleanup is handled by Phaser internally
  }

  /**
   * Abstract: initialize scene assets and state
   */
  abstract initializeScene(): void;

  /**
   * Abstract: per-frame update
   */
  abstract updateScene(time: number, delta: number): void;

  /**
   * create
   */
  create(): void {
    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`scene_create_start:${this.scene.key}`);
      }
    } catch {
      /* noop */
    }

    this.initializeScene();

    // Wire Phaser 'update' to updateScene
    this.events.on('update', this.updateScene, this);

    try {
      if (
        typeof performance !== 'undefined' &&
        performance.mark &&
        performance.measure
      ) {
        performance.mark(`scene_create_end:${this.scene.key}`);
        performance.measure(
          `scene_create_duration:${this.scene.key}`,
          `scene_create_start:${this.scene.key}`,
          `scene_create_end:${this.scene.key}`
        );
      }
    } catch {
      /* noop */
    }
  }

  /**
   * update
   */
  update(time: number, delta: number): void {
    this.updateScene(time, delta);
  }
}
