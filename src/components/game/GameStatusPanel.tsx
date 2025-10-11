/**
 * Game status panel (HUD)
 * Health, score, level, inventory, position, debug info
 */

import { useState } from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import type { GameState } from '../../ports/game-engine.port';
import './GameStatusPanel.css';
import { useI18n } from '@/i18n';

interface GameStatusPanelProps {
  gameState?: GameState | null;
  className?: string;
  showDetailed?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function GameStatusPanel({
  gameState: initialGameState,
  className = '',
  showDetailed = false,
  position = 'top-right',
}: GameStatusPanelProps) {
  const [isVisible, setIsVisible] = useState(true);
  const t = useI18n();

  // Context game state (fallback to prop)
  const { gameState: contextGameState } = useGameState();

  // Context
  const gameState = contextGameState || initialGameState;

  // Compute health percentage for bar
  const healthPercentage = gameState
    ? Math.max(0, (gameState.health / 100) * 100)
    : 0;

  // Color thresholds for health bar
  const getHealthColor = () => {
    if (healthPercentage >= 70) return '#22c55e';
    if (healthPercentage >= 30) return '#f59e0b';
    return '#ef4444';
  };

  // CSS position modifier
  const getPositionClass = () => {
    switch (position) {
      case 'top-left':
        return 'game-status-panel--top-left';
      case 'top-right':
        return 'game-status-panel--top-right';
      case 'bottom-left':
        return 'game-status-panel--bottom-left';
      case 'bottom-right':
        return 'game-status-panel--bottom-right';
      default:
        return 'game-status-panel--top-right';
    }
  };

  // Toggle visibility (collapse panel)
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!gameState) {
    return null;
  }

  return (
    <div
      className={`game-status-panel ${getPositionClass()} ${
        isVisible ? 'game-status-panel--visible' : 'game-status-panel--hidden'
      } ${className}`}
      data-testid="game-status-panel"
    >
      {/* Header */}
      <div
        className={`game-status-panel__header ${
          isVisible
            ? 'game-status-panel__header--visible'
            : 'game-status-panel__header--collapsed'
        }`}
      >
        <span className="game-status-panel__title">{t('statusPanel.title')}</span>
        <button
          onClick={toggleVisibility}
          className="game-status-panel__toggle-btn"
          title={isVisible ? t('statusPanel.collapse') : t('statusPanel.expand')}
          aria-label={isVisible ? t('statusPanel.collapse') : t('statusPanel.expand')}
        >
          {isVisible ? '–' : '+'}
        </button>
      </div>

      {/* Content */}
      {isVisible && (
        <div className="game-status-panel__content">
          {/* Health section */}
          <div>
            <div className="game-status-panel__health-header">
              <span className="game-status-panel__health-label">{t('statusPanel.health')}</span>
              <span className="game-status-panel__health-value">
                {gameState.health}/100
              </span>
            </div>
            <div className="game-status-panel__health-bar">
              <div
                className="game-status-panel__health-fill"
                style={{
                  width: `${healthPercentage}%`,
                  backgroundColor: getHealthColor(),
                }}
              />
            </div>
          </div>

          {/* Basic stats */}
          <div className="game-status-panel__stats">
            <div>
              <div className="game-status-panel__stat-label">{t('statusPanel.score')}</div>
              <div className="game-status-panel__score-value">
                {gameState.score.toLocaleString()}
              </div>
            </div>
            <div className="game-status-panel__level-container">
              <div className="game-status-panel__stat-label">{t('statusPanel.level')}</div>
              <div className="game-status-panel__level-value">
                {gameState.level}
              </div>
            </div>
          </div>

          {/* Detailed section */}
          {showDetailed && (
            <>
              {/* Inventory */}
              <div>
                <div className="game-status-panel__inventory-label">
                  {t('statusPanel.inventory', { count: gameState.inventory?.length || 0 })}
                </div>
                {gameState.inventory && gameState.inventory.length > 0 ? (
                  <div className="game-status-panel__inventory-items">
                    {gameState.inventory.map((item, index) => (
                      <div
                        key={index}
                        className="game-status-panel__inventory-item"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="game-status-panel__inventory-empty">
                    {t('statusPanel.inventoryEmpty')}
                  </div>
                )}
              </div>

              {/* Position */}
              {gameState.position && (
                <div>
                  <div className="game-status-panel__position-label">{t('statusPanel.position')}</div>
                  <div className="game-status-panel__position-value">
                    X: {Math.round(gameState.position.x)}, Y:{' '}
                    {Math.round(gameState.position.y)}
                  </div>
                </div>
              )}

              {/* IDs (dev only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="game-status-panel__debug-info">
                  <div className="game-status-panel__debug-id">
                    {t('statusPanel.id')}: {gameState.id}
                  </div>
                  <div className="game-status-panel__debug-timestamp">
                    {t('statusPanel.timestamp')}: {new Date(gameState.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
