/**
 * Game save manager component.
 * Provides create, load, export and delete operations for game saves.
 */

import { useState, useEffect, useCallback } from 'react';
import { useGameEvents } from '../../hooks/useGameEvents';
import { useSaveManager } from '../../contexts/GameStateContext';
import type { SaveData } from '../../game/state/GameStateManager';
import './GameSaveManager.css';
import { useI18n } from '@/i18n';
function useTexts() {
  const t = useI18n();
  return {
    title: t('saveManager.title'),
    refresh: t('saveManager.refresh'),
    close: t('saveManager.close'),
    loading: t('saveManager.loading'),
    emptyTitle: t('saveManager.emptyTitle'),
    emptySubtitle: t('saveManager.emptySubtitle'),
    itemTitle: (id: string) => t('saveManager.itemTitle', { id: id.slice(-8) }),
    level: (lv: number) => t('saveManager.level', { lv }),
    score: (s: number) => t('saveManager.score', { score: s.toLocaleString() }),
    health: (hp: number) => t('saveManager.health', { hp }),
    created: t('saveManager.created'),
    updated: t('saveManager.updated'),
    size: t('saveManager.size'),
    inventoryMore: (n: number) => t('saveManager.inventoryMore', { n }),
    btnLoad: t('saveManager.btnLoad'),
    btnExport: t('saveManager.btnExport'),
    btnDelete: t('saveManager.btnDelete'),
    tipLoad: t('saveManager.tipLoad'),
    tipExport: t('saveManager.tipExport'),
    tipDelete: t('saveManager.tipDelete'),
    deleteTitle: t('saveManager.deleteTitle'),
    deleteMessage: t('saveManager.deleteMessage'),
    cancel: t('saveManager.cancel'),
    confirmDelete: t('saveManager.confirmDelete'),
    errList: t('saveManager.errList'),
    errLoad: t('saveManager.errLoad'),
    errExport: t('saveManager.errExport'),
    errDelete: t('saveManager.errDelete'),
  } as const;
}

interface GameSaveManagerProps {
  className?: string;
  isVisible: boolean;
  onClose: () => void;
  onSaveSelected?: (saveFile: SaveData) => void;
  onError?: (error: string) => void;
}

export function GameSaveManager({
  className = '',
  isVisible,
  onClose,
  onSaveSelected,
  onError,
}: GameSaveManagerProps) {
  const TEXT = useTexts();
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Use the shared save manager context
  const { saveFiles, isLoadingSaves, loadGame, deleteSave, refreshSaveList } =
    useSaveManager();

  const gameEvents = useGameEvents({ context: 'game-save-manager' });

  // Refresh list (the Provider loads initially; here we provide a manual refresh hook)
  const loadSaveFiles = useCallback(async () => {
    try {
      await refreshSaveList();
    } catch (error) {
      console.error('Failed to refresh save files:', error);
      onError?.(TEXT.errList);
    }
  }, [refreshSaveList, onError]);

  // Load a save
  const handleLoadSave = useCallback(
    async (saveFile: SaveData) => {
      try {
        const success = await loadGame(saveFile.id);
        if (success) {
          onSaveSelected?.(saveFile);
          onClose();
        } else {
          onError?.(TEXT.errLoad);
        }
      } catch (error) {
        console.error('Failed to load save:', error);
        onError?.(TEXT.errLoad);
      }
    },
    [loadGame, onSaveSelected, onClose, onError]
  );

  // Delete a save
  const handleDeleteSave = useCallback(
    async (saveId: string) => {
      try {
        const success = await deleteSave(saveId);
        if (success) {
          setShowDeleteConfirm(null);
          gameEvents.publish({ type: 'game.save.deleted', data: { saveId } });
        } else {
          onError?.(TEXT.errDelete);
        }
      } catch (error) {
        console.error('Failed to delete save:', error);
        onError?.(TEXT.errDelete);
      }
    },
    [deleteSave, gameEvents, onError]
  );

  // Export a save to JSON
  const handleExportSave = useCallback(
    (saveFile: SaveData) => {
      try {
        const dataStr = JSON.stringify(saveFile, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `guild-game-save-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to export save:', error);
        onError?.(TEXT.errExport);
      }
    },
    [onError]
  );

  // Listen for save created (Provider updates list; we keep UI hints here)
  useEffect(() => {
    const subscription = gameEvents.subscribe('game.save.created', () => {
      console.log('New save created');
    });
    return () => {
      gameEvents.unsubscribe(subscription);
    };
  }, [gameEvents]);

  // First-time load if needed
  useEffect(() => {
    if (isVisible && saveFiles.length === 0 && !isLoadingSaves) {
      loadSaveFiles();
    }
  }, [isVisible, saveFiles.length, isLoadingSaves, loadSaveFiles]);

  // Pretty-print file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Compute size for a save object
  const getSaveSize = (saveFile: SaveData) => {
    const jsonStr = JSON.stringify(saveFile);
    return new Blob([jsonStr]).size;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`game-save-manager ${className}`}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      data-testid="game-save-manager"
    >
      <div className="game-save-manager__dialog">
        {/* Header */}
        <div className="game-save-manager__header">
          <h2 className="game-save-manager__title">{TEXT.title}</h2>

          <div className="game-save-manager__header-controls">
            <button
              onClick={loadSaveFiles}
              disabled={isLoadingSaves}
              className="game-save-manager__refresh-btn"
              title={TEXT.refresh}
            >
              {TEXT.refresh}
            </button>

            <button
              onClick={onClose}
              className="game-save-manager__close-btn"
              title={TEXT.close}
            >
              X
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="game-save-manager__content">
          {isLoadingSaves ? (
            <div className="game-save-manager__loading">
              <div className="game-save-manager__loading-icon">...</div>
              <div>{TEXT.loading}</div>
            </div>
          ) : saveFiles.length === 0 ? (
            <div className="game-save-manager__empty">
              <div className="game-save-manager__empty-icon">[ ]</div>
              <div className="game-save-manager__empty-title">
                {TEXT.emptyTitle}
              </div>
              <div className="game-save-manager__empty-subtitle">
                {TEXT.emptySubtitle}
              </div>
            </div>
          ) : (
            <div className="game-save-manager__saves-list">
              {saveFiles.map(saveFile => (
                <div
                  key={saveFile.id}
                  className={`game-save-manager__save-item ${
                    selectedSaveId === saveFile.id
                      ? 'game-save-manager__save-item--selected'
                      : ''
                  }`}
                  onClick={() => setSelectedSaveId(saveFile.id)}
                  onDoubleClick={() => handleLoadSave(saveFile)}
                >
                  <div className="game-save-manager__save-item-content">
                    {/* Save info */}
                    <div className="game-save-manager__save-info">
                      <div className="game-save-manager__save-header">
                        <div className="game-save-manager__save-title">
                          {TEXT.itemTitle(saveFile.id)}
                        </div>

                        <div className="game-save-manager__save-stats">
                          <span className="game-save-manager__save-level">
                            {TEXT.level(saveFile.state.level)}
                          </span>
                          <span className="game-save-manager__save-score">
                            {TEXT.score(saveFile.state.score)}
                          </span>
                          <span className="game-save-manager__save-health">
                            {TEXT.health(saveFile.state.health)}
                          </span>
                        </div>
                      </div>

                      <div className="game-save-manager__save-meta">
                        <div>
                          {TEXT.created}{' '}
                          {saveFile.metadata.createdAt.toLocaleString()}
                        </div>
                        <div>
                          {TEXT.updated}{' '}
                          {saveFile.metadata.updatedAt.toLocaleString()}
                        </div>
                        <div>
                          {TEXT.size} {formatFileSize(getSaveSize(saveFile))}
                        </div>
                      </div>

                      {/* Inventory preview */}
                      {saveFile.state.inventory &&
                        saveFile.state.inventory.length > 0 && (
                          <div className="game-save-manager__inventory-preview">
                            {saveFile.state.inventory
                              .slice(0, 5)
                              .map((item, index) => (
                                <div
                                  key={index}
                                  className="game-save-manager__inventory-item"
                                >
                                  {item}
                                </div>
                              ))}
                            {saveFile.state.inventory.length > 5 && (
                              <div className="game-save-manager__inventory-more">
                                {TEXT.inventoryMore(
                                  saveFile.state.inventory.length - 5
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="game-save-manager__save-actions">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleLoadSave(saveFile);
                        }}
                        className="game-save-manager__action-btn game-save-manager__load-btn"
                        title={TEXT.tipLoad}
                      >
                        {TEXT.btnLoad}
                      </button>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleExportSave(saveFile);
                        }}
                        className="game-save-manager__action-btn game-save-manager__export-btn"
                        title={TEXT.tipExport}
                      >
                        {TEXT.btnExport}
                      </button>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setShowDeleteConfirm(saveFile.id);
                        }}
                        className="game-save-manager__action-btn game-save-manager__delete-btn"
                        title={TEXT.tipDelete}
                      >
                        {TEXT.btnDelete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div
          className="game-save-manager__delete-overlay"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="game-save-manager__delete-dialog"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="game-save-manager__delete-title">
              {TEXT.deleteTitle}
            </h3>

            <p className="game-save-manager__delete-message">
              {TEXT.deleteMessage}
            </p>

            <div className="game-save-manager__delete-actions">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="game-save-manager__delete-cancel"
              >
                {TEXT.cancel}
              </button>

              <button
                onClick={() => handleDeleteSave(showDeleteConfirm)}
                className="game-save-manager__delete-confirm"
              >
                {TEXT.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
