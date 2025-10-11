/**
 * React Hook for Game Event Communication
 * React Phaser
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { EventBus } from '../shared/events/EventBus';
import type {
  GameDomainEvent,
  GameEventHandler,
} from '../shared/contracts/events/GameEvents';
import { EventPriority } from '../shared/contracts/events/GameEvents';

// Note
const globalEventBus = new EventBus({
  maxListeners: 200,
  enableLogging: process.env.NODE_ENV === 'development',
  enableMetrics: true,
  queueSize: 2000,
});

// Note
export { globalEventBus };

export interface UseGameEventsOptions {
  context?: string; // Note
  priority?: EventPriority;
  enableAutoCleanup?: boolean; // Note
}

export interface GameEventSubscription {
  eventType: GameDomainEvent['type'];
  subscriptionId: string;
}

export function useGameEvents(options: UseGameEventsOptions = {}) {
  const {
    context = 'react-component',
    priority = EventPriority.NORMAL,
    enableAutoCleanup = true,
  } = options;

  // Note
  const subscriptionsRef = useRef<GameEventSubscription[]>([]);
  const eventBusRef = useRef(globalEventBus);

  // Subscribe to events
  const subscribe = useCallback(
    <T extends GameDomainEvent>(
      eventType: T['type'],
      handler: GameEventHandler<T>,
      subscribeOptions: {
        priority?: EventPriority;
        once?: boolean;
      } = {}
    ): string => {
      const subscriptionId = eventBusRef.current.subscribe(eventType, handler, {
        priority: subscribeOptions.priority || priority,
        once: subscribeOptions.once || false,
        context,
      });

      // Note
      subscriptionsRef.current.push({
        eventType,
        subscriptionId,
      });

      return subscriptionId;
    },
    [context, priority]
  );

  // Note
  const unsubscribe = useCallback((subscriptionId: string): boolean => {
    const success = eventBusRef.current.unsubscribe(subscriptionId);

    if (success) {
      // Note
      subscriptionsRef.current = subscriptionsRef.current.filter(
        sub => sub.subscriptionId !== subscriptionId
      );
    }

    return success;
  }, []);

  // Note
  const publish = useCallback(
    (event: GameDomainEvent): void => {
      eventBusRef.current.publish(event, {
        source: context,
        priority,
      });
    },
    [context, priority]
  );

  // Note
  const publishAsync = useCallback(
    async (event: GameDomainEvent): Promise<void> => {
      await eventBusRef.current.publishAsync(event, {
        source: context,
        priority,
      });
    },
    [context, priority]
  );

  // Phaser
  const sendCommandToPhaser = useCallback(
    (
      command: 'pause' | 'resume' | 'save' | 'load' | 'restart',
      data?: any
    ): void => {
      const eventMap = {
        pause: {
          type: 'react.command.pause' as const,
          data: { timestamp: new Date() },
        },
        resume: {
          type: 'react.command.resume' as const,
          data: { timestamp: new Date() },
        },
        save: {
          type: 'react.command.save' as const,
          data: { saveId: data?.saveId, timestamp: new Date() },
        },
        load: {
          type: 'react.command.load' as const,
          data: { saveId: data?.saveId, timestamp: new Date() },
        },
        restart: {
          type: 'react.command.restart' as const,
          data: { timestamp: new Date() },
        },
      };

      const event = eventMap[command];
      if (event) {
        publish(event);
      }
    },
    [publish]
  );

  // Listen for Phaser responses
  const onPhaserResponse = useCallback(
    (
      handler: (
        event: Extract<
          GameDomainEvent,
          { type: 'phaser.response.ready' | 'phaser.response.completed' }
        >
      ) => void,
      once: boolean = false
    ): string[] => {
      const readySubId = subscribe('phaser.response.ready', handler, { once });
      const completedSubId = subscribe('phaser.response.completed', handler, {
        once,
      });

      return [readySubId, completedSubId];
    },
    [subscribe]
  );

  // Note
  const onGameStateChange = useCallback(
    (
      handler: (
        event: Extract<
          GameDomainEvent,
          { type: 'game.state.updated' | 'game.state.changed' }
        >
      ) => void
    ): string[] => {
      const updatedSubId = subscribe('game.state.updated', handler);
      const changedSubId = subscribe('game.state.changed', handler);

      return [updatedSubId, changedSubId];
    },
    [subscribe]
  );

  // Note
  const onGameError = useCallback(
    (
      handler: (
        event: Extract<GameDomainEvent, { type: 'game.error' | 'game.warning' }>
      ) => void
    ): string[] => {
      const errorSubId = subscribe('game.error', handler);
      const warningSubId = subscribe('game.warning', handler);

      return [errorSubId, warningSubId];
    },
    [subscribe]
  );

  // Note
  const getStats = useCallback(
    () => ({
      listenerStats: eventBusRef.current.getListenerStats(),
      metrics: eventBusRef.current.getMetrics(),
      activeSubscriptions: subscriptionsRef.current.length,
    }),
    []
  );

  // Note
  const hasListeners = useCallback(
    (eventType: GameDomainEvent['type']): boolean => {
      return eventBusRef.current.hasListeners(eventType);
    },
    []
  );

  // Note
  const cleanup = useCallback(() => {
    subscriptionsRef.current.forEach(({ subscriptionId }) => {
      eventBusRef.current.unsubscribe(subscriptionId);
    });
    subscriptionsRef.current = [];
  }, []);

  // Note
  useEffect(() => {
    if (enableAutoCleanup) {
      return cleanup;
    }
  }, [cleanup, enableAutoCleanup]);

  // API
  return useMemo(
    () => ({
      // API
      subscribe,
      unsubscribe,
      publish,
      publishAsync,

      // Note
      sendCommandToPhaser,
      onPhaserResponse,
      onGameStateChange,
      onGameError,

      // Note
      getStats,
      hasListeners,
      cleanup,

      // Note
      eventBus: eventBusRef.current,
    }),
    [
      subscribe,
      unsubscribe,
      publish,
      publishAsync,
      sendCommandToPhaser,
      onPhaserResponse,
      onGameStateChange,
      onGameError,
      getStats,
      hasListeners,
      cleanup,
    ]
  );
}

// Hook
export function useGameEvent<T extends GameDomainEvent>(
  eventType: T['type'],
  handler: GameEventHandler<T>,
  options: UseGameEventsOptions & {
    once?: boolean;
    autoSubscribe?: boolean;
  } = {}
) {
  const { once = false, autoSubscribe = true, ...hookOptions } = options;

  const { subscribe, unsubscribe } = useGameEvents(hookOptions);
  const subscriptionIdRef = useRef<string | null>(null);

  const subscribeToEvent = useCallback(() => {
    if (subscriptionIdRef.current) {
      unsubscribe(subscriptionIdRef.current);
    }

    subscriptionIdRef.current = subscribe(eventType, handler, { once });
    return subscriptionIdRef.current;
  }, [eventType, handler, once, subscribe, unsubscribe]);

  const unsubscribeFromEvent = useCallback(() => {
    if (subscriptionIdRef.current) {
      const success = unsubscribe(subscriptionIdRef.current);
      if (success) {
        subscriptionIdRef.current = null;
      }
      return success;
    }
    return false;
  }, [unsubscribe]);

  // Note
  useEffect(() => {
    if (autoSubscribe) {
      subscribeToEvent();
    }

    return () => {
      unsubscribeFromEvent();
    };
  }, [autoSubscribe, subscribeToEvent, unsubscribeFromEvent]);

  return {
    subscribe: subscribeToEvent,
    unsubscribe: unsubscribeFromEvent,
    isSubscribed: subscriptionIdRef.current !== null,
  };
}
