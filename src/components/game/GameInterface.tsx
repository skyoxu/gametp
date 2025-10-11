/**
 * Game interface shell
 * Composes canvas, status, controls, notifications, and guild manager
 */

import { useState, useCallback, useEffect } from 'react';
import { useGameEvents } from '../../hooks/useGameEvents';
import { GameStateProvider } from '../../contexts/GameStateContext';
import { GameCanvas } from '../GameCanvas';
import { GameStatusPanel } from './GameStatusPanel';
import { GameControlPanel } from './GameControlPanel';
import { GameNotifications } from './GameNotifications';
import { GameSaveManager } from './GameSaveManager';
import { GameSettingsPanel } from './GameSettingsPanel';
import GuildManager from '../guild/GuildManager';
import '../guild/GuildManager.css';
import type { GameSettings } from './GameSettingsPanel';
import type { GameState } from '../../ports/game-engine.port';
import type { DomainEvent } from '../../shared/contracts/events';
import './GameInterface.css';
import { useI18n } from '@/i18n';

interface GameInterfaceProps {
  className?: string;
  width?: number;
  height?: number;
  showDebugInfo?: boolean;
}

export function GameInterface({
  className = '',
  width = 800,
  height = 600,
  showDebugInfo = process.env.NODE_ENV === 'development',
}: GameInterfaceProps) {
  // Local UI state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(true);
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [showGuildManager, setShowGuildManager] = useState(true);
  const t = useI18n();

  // User-configurable settings (UI and gameplay)
  const [gameSettings, setGameSettings] = useState<Partial<GameSettings>>({
    ui: {
      theme: 'dark' as const,
      language: 'zh-CN',
      showAdvancedStats: false,
      notificationPosition: 'top-right' as const,
    },
    gameplay: {
      difficulty: 'medium' as const,
      autoSave: true,
      autoSaveInterval: 300,
      showNotifications: true,
      showTutorials: true,
    },
  });

  const gameEvents = useGameEvents({
    context: 'game-interface',
  });

  // Handle game events
  const handleGameEvent = useCallback((event: DomainEvent) => {
    console.log('Game Interface Event:', event.type, event);

    // Note
    if (event.type.includes('game.engine.started')) {
      setIsGameRunning(true);
      setError(null);
    } else if (event.type.includes('game.engine.paused')) {
      setIsGameRunning(false);
    } else if (event.type.includes('game.engine.resumed')) {
      setIsGameRunning(true);
    } else if (event.type.includes('game.engine.ended')) {
      setIsGameRunning(false);
    } else if (
      event.type.includes('game.error') &&
      event.data &&
      typeof event.data === 'object' &&
      'error' in event.data
    ) {
      setError((event.data as { error: string }).error);
    }
  }, []);

  // Propagate game state changes into local state
  const handleGameStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  // Global keyboard shortcuts (ESC pause/resume, F5 save, F9 save manager, F10 settings)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when focus is on an input element
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (event.code) {
        case 'Escape':
          event.preventDefault();
          if (showSaveManager) {
            setShowSaveManager(false);
          } else if (showSettings) {
            setShowSettings(false);
          } else {
            // Toggle pause/resume via EventBus
            gameEvents.sendCommandToPhaser(isGameRunning ? 'pause' : 'resume');
          }
          break;

        case 'F5':
          event.preventDefault();
          gameEvents.sendCommandToPhaser('save');
          break;

        case 'F9':
          event.preventDefault();
          setShowSaveManager(true);
          break;

        case 'F10':
          event.preventDefault();
          setShowSettings(true);
          break;

        case 'Tab':
          event.preventDefault();
          setShowStatusPanel(!showStatusPanel);
          break;

        case 'KeyH':
          if (event.ctrlKey) {
            event.preventDefault();
            setShowControlPanel(!showControlPanel);
          }
          break;

        case 'KeyN':
          if (event.ctrlKey) {
            event.preventDefault();
            setShowNotifications(!showNotifications);
          }
          break;

        case 'KeyG':
          event.preventDefault();
          setShowGuildManager(!showGuildManager);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    gameEvents,
    isGameRunning,
    showSaveManager,
    showSettings,
    showStatusPanel,
    showControlPanel,
    showNotifications,
    showGuildManager,
  ]);

  // Listen for Phaser responses
  useEffect(() => {
    const subscriptions = gameEvents.onPhaserResponse(event => {
      if (event.type === 'phaser.response.completed') {
        const { command } = event.data;
        switch (command) {
          case 'pause':
            setIsGameRunning(false);
            break;
          case 'resume':
          case 'load':
          case 'restart':
            setIsGameRunning(true);
            break;
        }
      }
    });

    return () => {
      subscriptions.forEach(subId => gameEvents.unsubscribe(subId));
    };
  }, [gameEvents]);

  return (
    <GameStateProvider
      stateManagerOptions={{
        storageKey: 'guild-manager-game',
        maxSaves: 20,
        autoSaveInterval: 30000,
        enableCompression: true,
      }}
      synchronizerOptions={{
        syncInterval: 500,
        conflictResolution: 'priority',
        enableBidirectionalSync: true,
      }}
    >
      <div
        className={`game-interface ${className}`}
        data-testid="game-interface"
      >
        {/* Main GameCanvas (hidden when guild manager is visible) */}
        {!showGuildManager && (
          <GameCanvas
            width={width}
            height={height}
            onGameEvent={handleGameEvent}
            onGameStateChange={handleGameStateChange}
            className="main-game-canvas"
          />
        )}

        {/* Guild Manager */}
        {showGuildManager && <GuildManager isVisible={showGuildManager} />}

        {/* Status panel */}
        {showStatusPanel && (
          <GameStatusPanel
            gameState={gameState}
            showDetailed={gameSettings.ui.showAdvancedStats}
            position="top-right"
          />
        )}

        {/* Control panel */}
        {showControlPanel && (
          <GameControlPanel
            position="bottom"
            showAdvanced={showDebugInfo}
            onSaveSuccess={() => {
              console.log('Game saved successfully');
            }}
            onLoadRequest={() => setShowSaveManager(true)}
            onError={setError}
          />
        )}

        {/* Notifications overlay */}
        {showNotifications && gameSettings.gameplay?.showNotifications && (
          <GameNotifications
            position={
              gameSettings.ui?.notificationPosition === 'top-left' ||
              gameSettings.ui?.notificationPosition === 'bottom-left'
                ? 'top-center'
                : (gameSettings.ui?.notificationPosition as
                    | 'top-center'
                    | 'top-right'
                    | 'bottom-center'
                    | 'bottom-right')
            }
            maxNotifications={5}
          />
        )}

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="game-interface__settings-btn"
          title={t('interface.titleSettings')}
          aria-label={t('interface.settings')}
        >
          {t('interface.settings')}
        </button>

        {/* Save manager button */}
        <button
          onClick={() => setShowSaveManager(true)}
          className="game-interface__save-manager-btn"
          title={t('interface.titleSaveManager')}
          aria-label={t('interface.saveManager')}
        >
          {t('interface.saveManager')}
        </button>

        {/* Guild Manager toggle */}
        <button
          onClick={() => setShowGuildManager(!showGuildManager)}
          className="game-interface__guild-manager-btn"
          title={t('interface.titleGuildManager')}
          aria-label={t('interface.guildManager')}
        >
          {t('interface.guildManager')}
        </button>

        {/* Debug panel */}
        {showDebugInfo && (
          <div className="game-interface__debug-panel">
            <div className="game-interface__debug-title">{t('interface.debug')}</div>

            <div>{t('interface.state')}</div>
            <div>FPS: {typeof window !== 'undefined' ? '60' : '0'}</div>
            <div>
              {t('interface.position')}: 
              {typeof performance !== 'undefined' && (performance as any).memory
                ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB`
                : 'N/A'}
            </div>

            {gameState && (
              <div className="game-interface__debug-state">
                <div>{t('interface.state')}</div>
                <div>{t('interface.position')}</div>
                <div>FPS</div>
                {gameState.position && (
                  <div>
                    ({Math.round(gameState.position.x)},{' '}
                    {Math.round(gameState.position.y)})
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="game-interface__debug-error">{error}</div>
            )}

            <div className="game-interface__debug-shortcuts">{t('interface.shortcuts')}: F10 | F9 | ESC | TAB</div>
          </div>
        )}

        {/* Save manager overlay */}
        <GameSaveManager
          isVisible={showSaveManager}
          onClose={() => setShowSaveManager(false)}
          onSaveSelected={() => setShowSaveManager(false)}
          onError={setError}
        />

        {/* Settings overlay */}
        <GameSettingsPanel
          isVisible={showSettings}
          onClose={() => setShowSettings(false)}
          onSettingsChange={(settings: Partial<GameSettings>) => {
            setGameSettings((prevSettings: Partial<GameSettings>) => ({
              ...prevSettings,
              ...settings,
              ui: { ...prevSettings.ui, ...settings.ui },
              gameplay: { ...prevSettings.gameplay, ...settings.gameplay },
            }));
            // Console-side trace for dev builds
            console.log('Settings updated:', settings);
          }}
        />

        {/* Error overlay */}
        {error && (
          <div className="game-interface__error-overlay">
            <div className="game-interface__error-icon">!</div>
            <div className="game-interface__error-message">{error}</div>
            <button
              onClick={() => setError(null)}
              className="game-interface__error-close-btn"
              aria-label={t('interface.errorClose')}
            >
              {t('interface.errorClose')}
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {!gameState && !error && (
          <div className="game-interface__loading-overlay">
            <div className="game-interface__loading-content">
              <div className="game-interface__loading-icon"></div>
              <div className="game-interface__loading-title">{t('interface.loading')}</div>
              <div className="game-interface__loading-subtitle">{t('interface.loadingSubtitle')}</div>
            </div>
          </div>
        )}
      </div>
    </GameStateProvider>
  );
}
