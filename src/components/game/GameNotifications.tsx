/**
 * Game notifications overlay
 * Toast-style messages for state changes, errors, and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useGameEvents } from '../../hooks/useGameEvents';
import './GameNotifications.css';
import { useI18n } from '@/i18n';

interface GameNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // ms; 0 or undefined => no auto-dismiss
  persistent?: boolean; // if true, never auto-dismiss
}

interface GameNotificationsProps {
  className?: string;
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
  maxNotifications?: number;
  defaultDuration?: number;
}

export function GameNotifications({
  className = '',
  position = 'top-right',
  maxNotifications = 5,
  defaultDuration = 4000,
}: GameNotificationsProps) {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const t = useI18n();

  const gameEvents = useGameEvents({
    context: 'game-notifications',
  });

  // Create and enqueue a notification
  const addNotification = useCallback(
    (notification: Omit<GameNotification, 'id' | 'timestamp'>) => {
      const newNotification: GameNotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        duration: notification.duration ?? defaultDuration,
        ...notification,
      };

      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, maxNotifications);
        return updated;
      });

      // Auto-dismiss after duration unless persistent
      if (
        newNotification.duration &&
        newNotification.duration > 0 &&
        !newNotification.persistent
      ) {
        setTimeout(() => {
          removeNotification(newNotification.id);
        }, newNotification.duration);
      }

      return newNotification.id;
    },
    [defaultDuration, maxNotifications]
  );

  // Remove single notification by id
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Wire event sources to notifications
  useEffect(() => {
    // Game state updates
    const stateSubscriptions = gameEvents.onGameStateChange(event => {
      const { gameState } = event.data;

      // Note
      if (gameState.level > 1) {
        addNotification({
          type: 'success',
          title: t('notifications.levelUpTitle'),
          message: t('notifications.levelUpMessage', {
            level: gameState.level,
          }),
          duration: 3000,
        });
      }

      // Low health warning
      if (gameState.health <= 20) {
        addNotification({
          type: 'warning',
          title: t('notifications.lowHealthTitle'),
          message: t('notifications.lowHealthMessage', {
            hp: gameState.health,
          }),
          duration: 5000,
        });
      }
    });

    // Game error surface
    const errorSubscriptions = gameEvents.onGameError(event => {
      const errorData = event.data as { error?: string; message?: string };
      addNotification({
        type: 'error',
        title: t('notifications.errorTitle'),
        message: errorData.error || errorData.message || '',
        duration: 6000,
        persistent: false,
      });
    });

    // Listen for Phaser responses
    const responseSubscriptions = gameEvents.onPhaserResponse(event => {
      if (event.type === 'phaser.response.completed') {
        const { command, result } = event.data;

        switch (command) {
          case 'save':
            if (result?.saveId) {
              addNotification({
                type: 'success',
                title: '',
                message: `ID: ${result.saveId.substring(0, 8)}...`,
                duration: 3000,
              });
            }
            break;
          case 'load':
            addNotification({
              type: 'info',
              title: '',
              message: '',
              duration: 3000,
            });
            break;
          case 'pause':
            addNotification({
              type: 'info',
              title: '',
              message: '',
              duration: 2000,
            });
            break;
          case 'resume':
            addNotification({
              type: 'info',
              title: '',
              message: '',
              duration: 2000,
            });
            break;
          case 'restart':
            addNotification({
              type: 'info',
              title: '',
              message: '',
              duration: 3000,
            });
            break;
        }
      }
    });

    // UI-triggered notifications
    const uiSubscription = gameEvents.subscribe(
      'game.ui.notification.shown',
      event => {
        const notificationData = event.data as {
          message?: string;
          type?: 'info' | 'success' | 'warning' | 'error';
        };
        addNotification({
          type: notificationData.type || 'info',
          title: '',
          message: notificationData.message || '',
          duration: 4000,
        });
      }
    );

    return () => {
      stateSubscriptions.forEach(subId => gameEvents.unsubscribe(subId));
      errorSubscriptions.forEach(subId => gameEvents.unsubscribe(subId));
      responseSubscriptions.forEach(subId => gameEvents.unsubscribe(subId));
      gameEvents.unsubscribe(uiSubscription);
    };
  }, [gameEvents, addNotification]);

  // Icon glyphs per type (ASCII-safe)
  const getNotificationIcon = (type: GameNotification['type']) => {
    switch (type) {
      case 'success':
        return '';
      case 'warning':
        return '';
      case 'error':
        return '';
      case 'info':
      default:
        return '';
    }
  };

  // Colors per type
  const getNotificationColor = (type: GameNotification['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'rgba(34, 197, 94, 0.15)',
          border: '#22c55e',
          text: '#22c55e',
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: '#f59e0b',
          text: '#f59e0b',
        };
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '#ef4444',
          text: '#ef4444',
        };
      case 'info':
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          border: '#3b82f6',
          text: '#3b82f6',
        };
    }
  };

  // Container position modifier
  const getContainerClassName = () => {
    switch (position) {
      case 'top-center':
        return 'game-notifications--top-center';
      case 'top-right':
        return 'game-notifications--top-right';
      case 'bottom-center':
        return 'game-notifications--bottom-center';
      case 'bottom-right':
        return 'game-notifications--bottom-right';
      default:
        return 'game-notifications--top-right';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`game-notifications ${getContainerClassName()} ${className}`}
      data-testid="game-notifications"
    >
      {notifications.map(notification => {
        const colors = getNotificationColor(notification.type);

        return (
          <div
            key={notification.id}
            className={`game-notifications__item game-notifications__item--${notification.type}`}
            onClick={() => removeNotification(notification.id)}
            title={t('notifications.itemTitle')}
          >
            {/* Close button */}
            <button
              onClick={e => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              className="game-notifications__close-btn"
              aria-label={t('notifications.close')}
            >
              ×
            </button>

            {/* Content container */}
            <div className="game-notifications__content">
              <span className="game-notifications__icon">
                {getNotificationIcon(notification.type)}
              </span>

              <div className="game-notifications__text">
                <div
                  className={`game-notifications__title game-notifications__title--${notification.type}`}
                >
                  {notification.title}
                </div>

                <div className="game-notifications__message">
                  {notification.message}
                </div>

                {/* Timestamp (local time) */}
                <div className="game-notifications__timestamp">
                  {notification.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Progress bar for auto-dismiss */}
            {notification.duration &&
              notification.duration > 0 &&
              !notification.persistent && (
                <div className="game-notifications__progress-container">
                  <div
                    className={`game-notifications__progress-bar game-notifications__progress-bar--${notification.type}`}
                    style={{
                      animation: `shrinkWidth ${notification.duration}ms linear`,
                    }}
                  />
                </div>
              )}
          </div>
        );
      })}

      {/* Clear all if more than one notification */}
      {notifications.length > 1 && (
        <button
          onClick={clearAllNotifications}
          className="game-notifications__clear-all"
          aria-label={t('notifications.clearAll', {
            count: notifications.length,
          })}
        >
          {t('notifications.clearAll', { count: notifications.length })}
        </button>
      )}
    </div>
  );
}
