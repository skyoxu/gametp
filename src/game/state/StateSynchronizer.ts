/**
 * Note
 * React
 */

import type { GameState } from '../../ports/game-engine.port';
import type { DomainEvent } from '../../shared/contracts/events';

export interface StateSource {
  id: string;
  getState(): GameState | null;
  setState(state: GameState): void;
}

export interface StateSynchronizerOptions {
  syncInterval?: number;
  conflictResolution?: 'latest' | 'priority' | 'merge';
  enableBidirectionalSync?: boolean;
}

export class StateSynchronizer {
  private sources: Map<string, StateSource> = new Map();
  private priorities: Map<string, number> = new Map();
  private lastStates: Map<string, GameState> = new Map();
  private syncTimer?: NodeJS.Timeout;
  private options: Required<StateSynchronizerOptions>;
  private eventCallbacks: Set<(event: DomainEvent) => void> = new Set();
  private isDestroyed = false;

  constructor(options: StateSynchronizerOptions = {}) {
    this.options = {
      syncInterval: 1000, // 1
      conflictResolution: 'latest',
      enableBidirectionalSync: true,
      ...options,
    };
  }

  /**
   * Note
   */
  registerSource(source: StateSource, priority: number = 0): void {
    if (this.isDestroyed) return;

    this.sources.set(source.id, source);
    this.priorities.set(source.id, priority);

    // Note
    const currentState = source.getState();
    if (currentState) {
      this.lastStates.set(source.id, { ...currentState });
    }

    this.publishEvent({
      type: 'state.synchronizer.source_registered',
      source: 'state-synchronizer',
      data: { sourceId: source.id, priority },
      timestamp: new Date(),
      time: new Date().toISOString(),
      id: `register-${Date.now()}`,
      specversion: '1.0',
      datacontenttype: 'application/json',
    });
  }

  /**
   * Note
   */
  unregisterSource(sourceId: string): void {
    if (this.isDestroyed) return;

    this.sources.delete(sourceId);
    this.priorities.delete(sourceId);
    this.lastStates.delete(sourceId);

    this.publishEvent({
      type: 'state.synchronizer.source_unregistered',
      source: 'state-synchronizer',
      data: { sourceId },
      timestamp: new Date(),
      time: new Date().toISOString(),
      id: `unregister-${Date.now()}`,
      specversion: '1.0',
      datacontenttype: 'application/json',
    });
  }

  /**
   * Note
   */
  startSync(): void {
    if (this.isDestroyed || this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      this.performSync();
    }, this.options.syncInterval);

    this.publishEvent({
      type: 'state.synchronizer.started',
      source: 'state-synchronizer',
      data: { interval: this.options.syncInterval },
      timestamp: new Date(),
      time: new Date().toISOString(),
      id: `sync-start-${Date.now()}`,
      specversion: '1.0',
      datacontenttype: 'application/json',
    });
  }

  /**
   * Note
   */
  stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;

      this.publishEvent({
        type: 'state.synchronizer.stopped',
        source: 'state-synchronizer',
        data: {},
        timestamp: new Date(),
        time: new Date().toISOString(),
        id: `sync-stop-${Date.now()}`,
        specversion: '1.0',
        datacontenttype: 'application/json',
      });
    }
  }

  /**
   * Note
   */
  sync(): void {
    if (this.isDestroyed) return;
    this.performSync();
  }

  /**
   * Note
   */
  forceState(state: GameState, excludeSourceId?: string): void {
    if (this.isDestroyed) return;

    for (const [sourceId, source] of this.sources) {
      if (sourceId !== excludeSourceId) {
        try {
          source.setState(state);
          this.lastStates.set(sourceId, { ...state });
        } catch (error) {
          console.error(`Failed to set state for source ${sourceId}:`, error);
        }
      }
    }

    this.publishEvent({
      type: 'state.synchronizer.forced',
      source: 'state-synchronizer',
      data: { state, excludeSourceId },
      timestamp: new Date(),
      time: new Date().toISOString(),
      id: `force-${Date.now()}`,
      specversion: '1.0',
      datacontenttype: 'application/json',
    });
  }

  /**
   * Note
   */
  getMergedState(): GameState | null {
    if (this.isDestroyed || this.sources.size === 0) return null;

    const states: Array<{
      sourceId: string;
      state: GameState;
      priority: number;
    }> = [];

    for (const [sourceId, source] of this.sources) {
      const state = source.getState();
      if (state) {
        states.push({
          sourceId,
          state,
          priority: this.priorities.get(sourceId) || 0,
        });
      }
    }

    if (states.length === 0) return null;
    if (states.length === 1) return { ...states[0].state };

    // Note
    switch (this.options.conflictResolution) {
      case 'priority':
        return this.mergeByPriority(states);
      case 'latest':
        return this.mergeByTimestamp(states);
      case 'merge':
        return this.mergeFields(states);
      default:
        return states[0].state;
    }
  }

  /**
   * Note
   */
  onEvent(callback: (event: DomainEvent) => void): void {
    this.eventCallbacks.add(callback);
  }

  /**
   * Note
   */
  offEvent(callback: (event: DomainEvent) => void): void {
    this.eventCallbacks.delete(callback);
  }

  /**
   * Note
   */
  destroy(): void {
    this.isDestroyed = true;
    this.stopSync();
    this.sources.clear();
    this.priorities.clear();
    this.lastStates.clear();
    this.eventCallbacks.clear();
  }

  /**
   * Note
   */
  private performSync(): void {
    if (this.isDestroyed || this.sources.size === 0) return;

    const changedSources: string[] = [];
    const currentStates: Map<string, GameState> = new Map();

    // Note
    for (const [sourceId, source] of this.sources) {
      const currentState = source.getState();
      if (currentState) {
        currentStates.set(sourceId, currentState);

        const lastState = this.lastStates.get(sourceId);
        if (!lastState || this.hasStateChanged(lastState, currentState)) {
          changedSources.push(sourceId);
          this.lastStates.set(sourceId, { ...currentState });
        }
      }
    }

    // Note
    if (changedSources.length > 0) {
      this.synchronizeStates(changedSources, currentStates);
    }
  }

  /**
   * Note
   */
  private synchronizeStates(
    changedSources: string[],
    currentStates: Map<string, GameState>
  ): void {
    // Note
    const authoritativeState = this.determineAuthoritativeState(
      changedSources,
      currentStates
    );

    if (!authoritativeState) return;

    const { sourceId: authSourceId, state: authState } = authoritativeState;

    // Note
    let syncedCount = 0;
    for (const [sourceId, source] of this.sources) {
      if (sourceId !== authSourceId && this.options.enableBidirectionalSync) {
        try {
          source.setState(authState);
          this.lastStates.set(sourceId, { ...authState });
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync state to source ${sourceId}:`, error);
        }
      }
    }

    if (syncedCount > 0) {
      this.publishEvent({
        type: 'state.synchronizer.synced',
        source: 'state-synchronizer',
        data: {
          authoritativeSource: authSourceId,
          syncedSources: Array.from(this.sources.keys()).filter(
            id => id !== authSourceId
          ),
          state: authState,
        },
        timestamp: new Date(),
        time: new Date().toISOString(),
        id: `sync-${Date.now()}`,
        specversion: '1.0',
        datacontenttype: 'application/json',
      });
    }
  }

  /**
   * Note
   */
  private determineAuthoritativeState(
    changedSources: string[],
    currentStates: Map<string, GameState>
  ): { sourceId: string; state: GameState } | null {
    const candidates = changedSources.map(sourceId => ({
      sourceId,
      state: currentStates.get(sourceId)!,
      priority: this.priorities.get(sourceId) || 0,
    }));

    switch (this.options.conflictResolution) {
      case 'priority':
        return candidates.reduce((best, current) =>
          current.priority > best.priority ? current : best
        );

      case 'latest':
        return candidates.reduce((best, current) =>
          current.state.timestamp > best.state.timestamp ? current : best
        );

      case 'merge': {
        // Note
        const highest = candidates.reduce((best, current) =>
          current.priority > best.priority ? current : best
        );
        return highest;
      }

      default:
        return candidates[0] || null;
    }
  }

  /**
   * Note
   */
  private mergeByPriority(
    states: Array<{ sourceId: string; state: GameState; priority: number }>
  ): GameState {
    return states.sort((a, b) => b.priority - a.priority)[0].state;
  }

  /**
   * Note
   */
  private mergeByTimestamp(
    states: Array<{ sourceId: string; state: GameState; priority: number }>
  ): GameState {
    return states.sort(
      (a, b) => b.state.timestamp.getTime() - a.state.timestamp.getTime()
    )[0].state;
  }

  /**
   * Note
   */
  private mergeFields(
    states: Array<{ sourceId: string; state: GameState; priority: number }>
  ): GameState {
    const baseState = states[0].state;
    const mergedState: GameState = { ...baseState };

    // Note
    for (const { state } of states) {
      Object.keys(state).forEach(key => {
        const stateKey = key as keyof GameState;
        if (state.timestamp > mergedState.timestamp) {
          (mergedState as any)[stateKey] = state[stateKey];
        }
      });
    }

    return mergedState;
  }

  /**
   * Note
   */
  private hasStateChanged(oldState: GameState, newState: GameState): boolean {
    // Note
    return JSON.stringify(oldState) !== JSON.stringify(newState);
  }

  /**
   * Note
   */
  private publishEvent(event: DomainEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in synchronizer event callback:', error);
      }
    });
  }
}
