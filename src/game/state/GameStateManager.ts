/**
 * GameStateManager
 * Persist, load and broadcast game state changes
 */

import type { GameState, GameConfig } from '../../ports/game-engine.port';
import type { DomainEvent } from '../../shared/contracts/events';

export interface SaveData {
  id: string;
  state: GameState;
  config: GameConfig;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    checksum: string;
  };
  screenshot?: string;
}

export interface GameStateManagerOptions {
  storageKey?: string;
  maxSaves?: number;
  autoSaveInterval?: number;
  enableCompression?: boolean;
}

export class GameStateManager {
  private options: Required<GameStateManagerOptions>;
  private autoSaveTimer?: NodeJS.Timeout;
  private currentState: GameState | null = null;
  private currentConfig: GameConfig | null = null;
  private eventCallbacks: Set<(event: DomainEvent) => void> = new Set();

  constructor(options: GameStateManagerOptions = {}) {
    this.options = {
      storageKey: 'guild-manager-game',
      maxSaves: 10,
      autoSaveInterval: 30000, // 30
      enableCompression: true,
      ...options,
    };
  }

  /**
   * Set current game state/config and emit update event
   */
  setState(state: GameState, config?: GameConfig): void {
    this.currentState = { ...state };
    if (config) {
      this.currentConfig = { ...config };
    }

    this.publishEvent({
      type: 'game.state.manager.updated',
      source: 'game-state-manager',
      data: { state, config },
      timestamp: new Date(),
      time: new Date().toISOString(),
      id: `state-update-${Date.now()}`,
      specversion: '1.0',
      datacontenttype: 'application/json',
    });
  }

  /**
   * Get current game state
   */
  getState(): GameState | null {
    return this.currentState ? { ...this.currentState } : null;
  }

  /**
   * Game configuration
   */
  getConfig(): GameConfig | null {
    return this.currentConfig ? { ...this.currentConfig } : null;
  }

  /**
   * Save game state
   */
  async saveGame(name?: string, screenshot?: string): Promise<string> {
    if (!this.currentState || !this.currentConfig) {
      throw new Error('No game state to save');
    }

    const saveId = `${this.options.storageKey}-${Date.now()}`;
    const saveData: SaveData = {
      id: saveId,
      state: { ...this.currentState },
      config: { ...this.currentConfig },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        checksum: await this.calculateChecksum(this.currentState),
      },
      screenshot,
    };

    try {
      // Persist to browser storage (localStorage)
      await this.saveToBrowser(saveId, saveData);

      // Enforce max saves retention policy
      await this.cleanupOldSaves();

      this.publishEvent({
        type: 'game.save.created',
        source: 'game-state-manager',
        data: { saveId, saveData: { ...saveData, state: undefined } }, // omit raw state in event payload
        timestamp: new Date(),
        time: new Date().toISOString(),
        id: `save-${Date.now()}`,
        specversion: '1.0',
        datacontenttype: 'application/json',
      });

      return saveId;
    } catch (error) {
      this.publishEvent({
        type: 'game.save.failed',
        source: 'game-state-manager',
        data: { error: (error as Error).message },
        timestamp: new Date(),
        time: new Date().toISOString(),
        id: `save-error-${Date.now()}`,
        specversion: '1.0',
        datacontenttype: 'application/json',
      });
      throw error;
    }
  }

  /**
   * Load a previously saved game by id, validate checksum and set as current
   */
  async loadGame(
    saveId: string
  ): Promise<{ state: GameState; config: GameConfig }> {
    try {
      const saveData = await this.loadFromBrowser(saveId);

      // Verify integrity via checksum
      const checksum = await this.calculateChecksum(saveData.state);
      if (checksum !== saveData.metadata.checksum) {
        throw new Error('Save file is corrupted');
      }

      // Update current state/config
      this.currentState = { ...saveData.state };
      this.currentConfig = { ...saveData.config };

      this.publishEvent({
        type: 'game.save.loaded',
        source: 'game-state-manager',
        data: { saveId, state: this.currentState, config: this.currentConfig },
        timestamp: new Date(),
        time: new Date().toISOString(),
        id: `load-${Date.now()}`,
        specversion: '1.0',
        datacontenttype: 'application/json',
      });

      return {
        state: { ...saveData.state },
        config: { ...saveData.config },
      };
    } catch (error) {
      this.publishEvent({
        type: 'game.save.load_failed',
        source: 'game-state-manager',
        data: { saveId, error: (error as Error).message },
        timestamp: new Date(),
        time: new Date().toISOString(),
        id: `load-error-${Date.now()}`,
        specversion: '1.0',
        datacontenttype: 'application/json',
      });
      throw error;
    }
  }

  /**
   * Enumerate save entries and return newest first
   */
  async getSaveList(): Promise<SaveData[]> {
    try {
      const saves: SaveData[] = [];
      const keys = Object.keys(localStorage);

      for (const key of keys) {
        if (key.startsWith(this.options.storageKey)) {
          try {
            const saveData = await this.loadFromBrowser(key);
            saves.push(saveData);
          } catch (error) {
            console.warn(`Failed to load save: ${key}`, error);
          }
        }
      }

      // Sort by createdAt descending
      saves.sort(
        (a, b) =>
          new Date(b.metadata.createdAt).getTime() -
          new Date(a.metadata.createdAt).getTime()
      );

      return saves;
    } catch (error) {
      console.error('Failed to get save list:', error);
      return [];
    }
  }

  /**
   * Delete a save by id and emit event
   */
  async deleteSave(saveId: string): Promise<void> {
    try {
      localStorage.removeItem(saveId);

      this.publishEvent({
        type: 'game.save.deleted',
        source: 'game-state-manager',
        data: { saveId },
        timestamp: new Date(),
        time: new Date().toISOString(),
        id: `delete-${Date.now()}`,
        specversion: '1.0',
        datacontenttype: 'application/json',
      });
    } catch (error) {
      this.publishEvent({
        type: 'game.save.delete_failed',
        source: 'game-state-manager',
        data: { saveId, error: (error as Error).message },
        timestamp: new Date(),
        time: new Date().toISOString(),
        id: `delete-error-${Date.now()}`,
        specversion: '1.0',
        datacontenttype: 'application/json',
      });
      throw error;
    }
  }

  /**
   * Enable periodic auto-save with configured interval
   */
  enableAutoSave(): void {
    if (this.autoSaveTimer) {
      return; // already enabled
    }

    this.autoSaveTimer = setInterval(async () => {
      if (this.currentState && this.currentConfig) {
        try {
          const saveId = await this.saveGame(`auto-save-${Date.now()}`);

          this.publishEvent({
            type: 'game.autosave.completed',
            source: 'game-state-manager',
            data: { saveId },
            timestamp: new Date(),
            time: new Date().toISOString(),
            id: `autosave-${Date.now()}`,
            specversion: '1.0',
            datacontenttype: 'application/json',
          });
        } catch (error) {
          this.publishEvent({
            type: 'game.autosave.failed',
            source: 'game-state-manager',
            data: { error: (error as Error).message },
            timestamp: new Date(),
            time: new Date().toISOString(),
            id: `autosave-error-${Date.now()}`,
            specversion: '1.0',
            datacontenttype: 'application/json',
          });
        }
      }
    }, this.options.autoSaveInterval);

    this.publishEvent({
      type: 'game.autosave.enabled',
      source: 'game-state-manager',
      data: { interval: this.options.autoSaveInterval },
      timestamp: new Date(),
      time: new Date().toISOString(),
      id: `autosave-enable-${Date.now()}`,
      specversion: '1.0',
      datacontenttype: 'application/json',
    });
  }

  /**
   * Disable auto-save and emit event
   */
  disableAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;

      this.publishEvent({
        type: 'game.autosave.disabled',
        source: 'game-state-manager',
        data: {},
        timestamp: new Date(),
        time: new Date().toISOString(),
        id: `autosave-disable-${Date.now()}`,
        specversion: '1.0',
        datacontenttype: 'application/json',
      });
    }
  }

  /**
   * Subscribe to events
   */
  onEvent(callback: (event: DomainEvent) => void): void {
    this.eventCallbacks.add(callback);
  }

  /**
   * Subscribe to events
   */
  offEvent(callback: (event: DomainEvent) => void): void {
    this.eventCallbacks.delete(callback);
  }

  /**
   * Destroy manager and release resources
   */
  destroy(): void {
    this.disableAutoSave();
    this.eventCallbacks.clear();
    this.currentState = null;
    this.currentConfig = null;
  }

  /**
   * Save serialized data to browser storage (size-guarded)
   */
  private async saveToBrowser(key: string, data: SaveData): Promise<void> {
    const serialized = JSON.stringify(data);

    // Prevent oversized entries (5MB)
    if (serialized.length > 5 * 1024 * 1024) {
      // 5MB
      throw new Error('Save data too large');
    }

    localStorage.setItem(key, serialized);
  }

  /**
   * Load and parse serialized data from browser storage
   */
  private async loadFromBrowser(key: string): Promise<SaveData> {
    const serialized = localStorage.getItem(key);
    if (!serialized) {
      throw new Error(`Save not found: ${key}`);
    }

    return JSON.parse(serialized);
  }

  /**
   * Enforce max saves retention by deleting oldest beyond limit
   */
  private async cleanupOldSaves(): Promise<void> {
    const saves = await this.getSaveList();

    if (saves.length > this.options.maxSaves) {
      const toDelete = saves.slice(this.options.maxSaves);

      for (const save of toDelete) {
        try {
          await this.deleteSave(save.id);
        } catch (error) {
          console.warn(`Failed to delete old save: ${save.id}`, error);
        }
      }
    }
  }

  /**
   * Lightweight checksum for integrity checks
   */
  private async calculateChecksum(state: GameState): Promise<string> {
    const stateStr = JSON.stringify(state, Object.keys(state).sort());

    // Simple integer hash
    let hash = 0;
    for (let i = 0; i < stateStr.length; i++) {
      const char = stateStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32
    }

    return hash.toString(16);
  }

  /**
   * Note
   */
  private publishEvent(event: DomainEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in state manager event callback:', error);
      }
    });
  }
}
