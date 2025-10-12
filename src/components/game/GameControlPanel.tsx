/**
 * Game control panel UI
 * Pause/Resume/Save/Load/Restart controls and status
 */

import { useState, useCallback, useEffect } from 'react';
import { useGameEvents } from '../../hooks/useGameEvents';
import { useGameState } from '../../contexts/GameStateContext';
import './GameControlPanel.css';
import { useI18n } from '@/i18n';

interface GameControlPanelProps {
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showAdvanced?: boolean;
  onSaveSuccess?: (saveId: string) => void;
  onLoadRequest?: () => void;
  onError?: (error: string) => void;
}

export function GameControlPanel({
  className = '',
  position = 'bottom',
  showAdvanced = false,
  onSaveSuccess,
  onLoadRequest,
  onError,
}: GameControlPanelProps) {
  const [isGameRunning, setIsGameRunning] = useState(true);
  const [lastSaveId, setLastSaveId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const gameEvents = useGameEvents({
    context: 'game-control-panel',
  });
  const t = useI18n();

  // Wire saveGame from context
  const { saveGame: saveGameState } = useGameState();

  // Listen for Phaser responses
  useEffect(() => {
    const subscriptions = gameEvents.onPhaserResponse(event => {
      setIsProcessing(false);

      if (event.type === 'phaser.response.completed') {
        const { command, result } = event.data;

        switch (command) {
          case 'pause':
            setIsGameRunning(false);
            break;
          case 'resume':
            setIsGameRunning(true);
            break;
          case 'save':
            if (result?.saveId) {
              setLastSaveId(result.saveId);
              onSaveSuccess?.(result.saveId);
            }
            break;
          case 'load':
            setIsGameRunning(true);
            break;
          case 'restart':
            setIsGameRunning(true);
            setLastSaveId(null);
            break;
        }
      }
    });

    return () => {
      subscriptions.forEach(subId => gameEvents.unsubscribe(subId));
    };
  }, [gameEvents, onSaveSuccess]);

  // Listen for error events from game bus
  useEffect(() => {
    const subscriptions = gameEvents.onGameError(event => {
      setIsProcessing(false);
      const errorData = event.data as { error?: string; message?: string };
      onError?.(errorData.error || errorData.message || '');
    });

    return () => {
      subscriptions.forEach(subId => gameEvents.unsubscribe(subId));
    };
  }, [gameEvents, onError]);

  // Guard against re-entrancy while processing
  const handlePause = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    gameEvents.sendCommandToPhaser('pause');
  }, [gameEvents, isProcessing]);

  const handleResume = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    gameEvents.sendCommandToPhaser('resume');
  }, [gameEvents, isProcessing]);

  const handleSave = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Context EventBus Phaser
      const saveId = await saveGameState();
      if (saveId) {
        setLastSaveId(saveId);
        onSaveSuccess?.(saveId);
      }
      gameEvents.sendCommandToPhaser('save');
    } catch (error) {
      console.error('Failed to save game:', error);
      onError?.((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, saveGameState, gameEvents, onSaveSuccess, onError]);

  const handleLoad = useCallback(() => {
    onLoadRequest?.();
  }, [onLoadRequest]);

  const handleRestart = useCallback(() => {
    if (isProcessing) return;
    if (!confirm(t('controlPanel.confirmRestart'))) return;

    setIsProcessing(true);
    gameEvents.sendCommandToPhaser('restart');
  }, [gameEvents, isProcessing]);

  const handleQuickSave = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Context
      const saveId = await saveGameState();
      if (saveId) {
        setLastSaveId(saveId);
      }
      gameEvents.sendCommandToPhaser('save');
    } catch (error) {
      console.error('Failed to quick save:', error);
      onError?.((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, saveGameState, gameEvents, onError]);

  const handleQuickLoad = useCallback(() => {
    if (!lastSaveId) return;
    if (isProcessing) return;

    setIsProcessing(true);
    gameEvents.sendCommandToPhaser('load', { saveId: lastSaveId });
  }, [gameEvents, lastSaveId, isProcessing]);

  return (
    <div
      className={`game-control-panel position-${position} ${className}`}
      data-testid="game-control-panel"
    >
      {/* Main control section */}
      <div className="control-main-section">
        {/* Toggle Pause/Resume */}
        <button
          onClick={isGameRunning ? handlePause : handleResume}
          disabled={isProcessing}
          className={`control-btn primary ${isGameRunning ? 'pause' : 'resume'}`}
          title={
            isGameRunning
              ? t('controlPanel.titlePause')
              : t('controlPanel.titleResume')
          }
          aria-label={
            isGameRunning
              ? t('controlPanel.ariaPause')
              : t('controlPanel.ariaResume')
          }
        >
          {isProcessing
            ? t('controlPanel.statusProcessing')
            : isGameRunning
              ? t('controlPanel.pause')
              : t('controlPanel.resume')}
        </button>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="control-btn secondary"
          title={t('controlPanel.titleSave')}
          aria-label={t('controlPanel.ariaSave')}
        >
          {isProcessing ? t('controlPanel.saving') : t('controlPanel.save')}
        </button>

        {/* Load button */}
        <button
          onClick={handleLoad}
          disabled={isProcessing}
          className="control-btn secondary"
          title={t('controlPanel.titleLoad')}
          aria-label={t('controlPanel.ariaLoad')}
        >
          {t('controlPanel.load')}
        </button>

        {/* Restart button */}
        <button
          onClick={handleRestart}
          disabled={isProcessing}
          className="control-btn danger"
          title={t('controlPanel.titleRestart')}
          aria-label={t('controlPanel.ariaRestart')}
        >
          {t('controlPanel.restart')}
        </button>
      </div>

      {/* Advanced controls */}
      {showAdvanced && (
        <div className="control-advanced-section">
          <span className="status-label" aria-live="polite"></span>

          {/* Quick Save (F5) */}
          <button
            onClick={handleQuickSave}
            disabled={isProcessing}
            className="control-btn small quick-save"
            title={t('controlPanel.titleQuickSave')}
            aria-label={t('controlPanel.ariaQuickSave')}
          >
            {t('controlPanel.quickSave')}
          </button>

          {/* Quick Load (F9) */}
          <button
            onClick={handleQuickLoad}
            disabled={isProcessing || !lastSaveId}
            className={`control-btn small quick-load ${!lastSaveId ? 'disabled' : ''}`}
            title={lastSaveId ? t('controlPanel.titleQuickLoad') : ''}
            aria-label={t('controlPanel.ariaQuickLoad')}
          >
            {t('controlPanel.quickLoad')}
          </button>

          {/* Status indicator */}
          <div className="status-indicator-section">
            <div
              className={`status-dot ${
                isProcessing
                  ? 'processing'
                  : isGameRunning
                    ? 'running'
                    : 'paused'
              }`}
            />
            <span className="status-text" aria-live="polite">
              {isProcessing
                ? t('controlPanel.statusProcessing')
                : isGameRunning
                  ? t('controlPanel.statusRunning')
                  : t('controlPanel.statusPaused')}
            </span>
          </div>
        </div>
      )}

      {/* Dev hints */}
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-hints">
          {t('controlPanel.hintEsc')} | {t('controlPanel.hintF5')} |{' '}
          {t('controlPanel.hintF9')}
        </div>
      )}
    </div>
  );
}
