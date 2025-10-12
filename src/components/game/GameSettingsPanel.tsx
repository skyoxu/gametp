/**
 * Game settings panel (ASCII-only UI strings).
 * Props:
 * - className: optional wrapper class
 * - isVisible: whether the panel is shown
 * - onClose: close handler
 * - onSettingsChange: optional callback when settings are saved
 */

import { useState, useEffect, useCallback } from 'react';
import { useGameEvents } from '../../hooks/useGameEvents';
import './GameSettingsPanel.css';
import { useI18n, useLang } from '@/i18n';

// 使用 i18n 文本资源
const ICONS = {
  graphics: '*',
  audio: '#',
  gameplay: '+',
  controls: '>',
  ui: '=',
} as const;

export interface GameSettings {
  // Graphics settings
  graphics: {
    quality: 'low' | 'medium' | 'high';
    fullscreen: boolean;
    vsync: boolean;
    showFPS: boolean;
  };

  // Audio settings
  audio: {
    masterVolume: number; // 0-100
    musicVolume: number; // 0-100
    sfxVolume: number; // 0-100
    muted: boolean;
  };

  // Gameplay settings
  gameplay: {
    difficulty: 'easy' | 'medium' | 'hard';
    autoSave: boolean;
    autoSaveInterval: number; // seconds
    showNotifications: boolean;
    showTutorials: boolean;
  };

  // Controls settings
  controls: {
    keyboardControls: {
      moveUp: string;
      moveDown: string;
      moveLeft: string;
      moveRight: string;
      action: string;
      pause: string;
    };
    mouseSensitivity: number; // 0-100
  };

  // UI settings
  ui: {
    theme: 'dark' | 'light' | 'auto';
    language: string;
    showAdvancedStats: boolean;
    notificationPosition:
      | 'top-right'
      | 'top-left'
      | 'bottom-right'
      | 'bottom-left';
  };
}

const defaultSettings: GameSettings = {
  graphics: {
    quality: 'medium',
    fullscreen: false,
    vsync: true,
    showFPS: false,
  },
  audio: {
    masterVolume: 80,
    musicVolume: 70,
    sfxVolume: 85,
    muted: false,
  },
  gameplay: {
    difficulty: 'medium',
    autoSave: true,
    autoSaveInterval: 300, // 5 minutes
    showNotifications: true,
    showTutorials: true,
  },
  controls: {
    keyboardControls: {
      moveUp: 'W',
      moveDown: 'S',
      moveLeft: 'A',
      moveRight: 'D',
      action: 'Space',
      pause: 'Escape',
    },
    mouseSensitivity: 50,
  },
  ui: {
    theme: 'dark',
    language: 'en-US',
    showAdvancedStats: false,
    notificationPosition: 'top-right',
  },
};

interface GameSettingsPanelProps {
  className?: string;
  isVisible: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: Partial<GameSettings>) => void;
}

/**
 * Render the GameSettingsPanel component.
 */
export function GameSettingsPanel({
  className = '',
  isVisible,
  onClose,
  onSettingsChange,
}: GameSettingsPanelProps) {
  const t = useI18n();
  const { lang, setLang } = useLang();
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<
    'graphics' | 'audio' | 'gameplay' | 'controls' | 'ui'
  >('graphics');
  const [hasChanges, setHasChanges] = useState(false);
  const [isKeyBinding, setIsKeyBinding] = useState<string | null>(null);

  const gameEvents = useGameEvents({
    context: 'game-settings-panel',
  });

  // Load settings from local storage and merge with defaults
  const loadSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem('guild-game-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Persist settings to local storage and emit notification
  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem('guild-game-settings', JSON.stringify(settings));
      onSettingsChange?.(settings);
      setHasChanges(false);

      // Publish a UI notification via event bus
      gameEvents.publish({
        type: 'game.ui.notification.shown',
        data: {
          message: t('settingsPanel.notify.saved'),
          type: 'success',
        },
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      gameEvents.publish({
        type: 'game.ui.notification.shown',
        data: {
          message: t('settingsPanel.notify.saveFailed'),
          type: 'error',
        },
      });
    }
  }, [settings, onSettingsChange, gameEvents, t]);

  // Reset settings to defaults (client-side)
  const resetSettings = useCallback(() => {
    if (confirm(t('settingsPanel.actions.confirmReset'))) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  }, [t]);

  // Update settings with strong typing per category and key
  const updateSettings = useCallback(
    <K extends keyof GameSettings, P extends keyof GameSettings[K]>(
      category: K,
      key: P,
      value: GameSettings[K][P]
    ) => {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value,
        },
      }));
      setHasChanges(true);
    },
    []
  );

  // Start key binding flow for a specific control key
  const handleKeyBinding = useCallback((controlKey: string) => {
    setIsKeyBinding(controlKey);

    const handleKeyPress = (event: KeyboardEvent) => {
      event.preventDefault();

      const key =
        event.key === ' '
          ? 'Space'
          : event.key === 'Escape'
            ? 'Escape'
            : event.key.toUpperCase();

      setSettings(prev => ({
        ...prev,
        controls: {
          ...prev.controls,
          keyboardControls: {
            ...prev.controls.keyboardControls,
            [controlKey]: key,
          },
        },
      }));

      setHasChanges(true);
      setIsKeyBinding(null);

      document.removeEventListener('keydown', handleKeyPress);
    };

    document.addEventListener('keydown', handleKeyPress);
  }, []);

  // Lazy load settings when panel becomes visible
  useEffect(() => {
    if (isVisible) {
      loadSettings();
    }
  }, [isVisible, loadSettings]);

  // Tabs definition backed by TEXT constants
  const tabs = [
    {
      id: 'graphics',
      name: t('settingsPanel.tabs.graphics'),
      icon: ICONS.graphics,
    },
    { id: 'audio', name: t('settingsPanel.tabs.audio'), icon: ICONS.audio },
    {
      id: 'gameplay',
      name: t('settingsPanel.tabs.gameplay'),
      icon: ICONS.gameplay,
    },
    {
      id: 'controls',
      name: t('settingsPanel.tabs.controls'),
      icon: ICONS.controls,
    },
    { id: 'ui', name: t('settingsPanel.tabs.ui'), icon: ICONS.ui },
  ] as const;

  if (!isVisible) {
    return null;
  }

  const renderSlider = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    min = 0,
    max = 100
  ) => (
    <div className="game-settings-panel__slider-container">
      <div className="game-settings-panel__slider-header">
        <label className="game-settings-panel__slider-label">{label}</label>
        <span className="game-settings-panel__slider-value">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="game-settings-panel__slider"
        aria-label={label}
        title={label}
      />
    </div>
  );

  const renderSelect = <T extends string>(
    label: string,
    value: T,
    options: { value: T; label: string }[],
    onChange: (value: T) => void
  ) => (
    <div className="game-settings-panel__select-container">
      <label className="game-settings-panel__select-label">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="game-settings-panel__select"
        aria-label={label}
        title={label}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderCheckbox = (
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ) => (
    <div className="game-settings-panel__checkbox-container">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="game-settings-panel__checkbox"
        aria-label={label}
        title={label}
      />
      <label className="game-settings-panel__checkbox-label">{label}</label>
    </div>
  );

  return (
    <div
      className={`game-settings-panel ${className}`}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      data-testid="game-settings-panel"
    >
      <div className="game-settings-panel__dialog">
        {/* Sidebar */}
        <div className="game-settings-panel__sidebar">
          <h2 className="game-settings-panel__sidebar-title">
            {t('settingsPanel.title')}
          </h2>

          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`game-settings-panel__tab ${
                activeTab === tab.id ? 'game-settings-panel__tab--active' : ''
              }`}
              title={tab.name}
              aria-label={tab.name}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="game-settings-panel__main">
          {/* Header */}
          <div className="game-settings-panel__header">
            <h3 className="game-settings-panel__header-title">
              {tabs.find(tab => tab.id === activeTab)?.icon}{' '}
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h3>

            <button
              onClick={onClose}
              className="game-settings-panel__close-btn"
              title={t('settingsPanel.actions.close')}
              aria-label={t('settingsPanel.actions.close')}
            >
              {t('settingsPanel.actions.close')}
            </button>
          </div>

          {/* Content */}
          <div className="game-settings-panel__content">
            {/* Graphics */}
            {activeTab === 'graphics' && (
              <div>
                {renderSelect(
                  t('settingsPanel.graphics.quality'),
                  settings.graphics.quality,
                  [
                    { value: 'low', label: t('settingsPanel.graphics.low') },
                    {
                      value: 'medium',
                      label: t('settingsPanel.graphics.medium'),
                    },
                    { value: 'high', label: t('settingsPanel.graphics.high') },
                  ],
                  value => updateSettings('graphics', 'quality', value)
                )}

                {renderCheckbox(
                  t('settingsPanel.graphics.fullscreen'),
                  settings.graphics.fullscreen,
                  checked => updateSettings('graphics', 'fullscreen', checked)
                )}

                {renderCheckbox(
                  t('settingsPanel.graphics.vsync'),
                  settings.graphics.vsync,
                  checked => updateSettings('graphics', 'vsync', checked)
                )}

                {renderCheckbox(
                  t('settingsPanel.graphics.showFPS'),
                  settings.graphics.showFPS,
                  checked => updateSettings('graphics', 'showFPS', checked)
                )}
              </div>
            )}

            {/* Audio */}
            {activeTab === 'audio' && (
              <div>
                {renderCheckbox(
                  t('settingsPanel.audio.muted'),
                  settings.audio.muted,
                  checked => updateSettings('audio', 'muted', checked)
                )}

                {renderSlider(
                  t('settingsPanel.audio.masterVolume'),
                  settings.audio.masterVolume,
                  value => updateSettings('audio', 'masterVolume', value)
                )}

                {renderSlider(
                  t('settingsPanel.audio.musicVolume'),
                  settings.audio.musicVolume,
                  value => updateSettings('audio', 'musicVolume', value)
                )}

                {renderSlider(
                  t('settingsPanel.audio.sfxVolume'),
                  settings.audio.sfxVolume,
                  value => updateSettings('audio', 'sfxVolume', value)
                )}
              </div>
            )}

            {/* Gameplay */}
            {activeTab === 'gameplay' && (
              <div>
                {renderSelect(
                  t('settingsPanel.gameplay.difficulty'),
                  settings.gameplay.difficulty,
                  [
                    { value: 'easy', label: t('settingsPanel.gameplay.easy') },
                    {
                      value: 'medium',
                      label: t('settingsPanel.gameplay.medium'),
                    },
                    { value: 'hard', label: t('settingsPanel.gameplay.hard') },
                  ],
                  value => updateSettings('gameplay', 'difficulty', value)
                )}

                {renderCheckbox(
                  t('settingsPanel.gameplay.autoSave'),
                  settings.gameplay.autoSave,
                  checked => updateSettings('gameplay', 'autoSave', checked)
                )}

                {settings.gameplay.autoSave &&
                  renderSlider(
                    t('settingsPanel.gameplay.autoSaveInterval'),
                    settings.gameplay.autoSaveInterval,
                    value =>
                      updateSettings('gameplay', 'autoSaveInterval', value),
                    60,
                    1800
                  )}

                {renderCheckbox(
                  t('settingsPanel.gameplay.showNotifications'),
                  settings.gameplay.showNotifications,
                  checked =>
                    updateSettings('gameplay', 'showNotifications', checked)
                )}

                {renderCheckbox(
                  t('settingsPanel.gameplay.showTutorials'),
                  settings.gameplay.showTutorials,
                  checked =>
                    updateSettings('gameplay', 'showTutorials', checked)
                )}
              </div>
            )}

            {/* Controls */}
            {activeTab === 'controls' && (
              <div>
                <div className="game-settings-panel__controls-section">
                  <h4 className="game-settings-panel__controls-title">
                    {t('settingsPanel.controls.keyboard')}
                  </h4>

                  {Object.entries(settings.controls.keyboardControls).map(
                    ([action, key]) => (
                      <div
                        key={action}
                        className="game-settings-panel__key-binding-row"
                      >
                        <span className="game-settings-panel__key-binding-label">
                          {t(`settingsPanel.controls.labels.${action}`)}
                        </span>

                        <button
                          onClick={() => handleKeyBinding(action)}
                          className={`game-settings-panel__key-binding-btn ${
                            isKeyBinding === action
                              ? 'game-settings-panel__key-binding-btn--active'
                              : ''
                          }`}
                        >
                          {isKeyBinding === action
                            ? t('settingsPanel.actions.rebinding')
                            : key}
                        </button>
                      </div>
                    )
                  )}
                </div>

                {renderSlider(
                  t('settingsPanel.controls.mouseSensitivity'),
                  settings.controls.mouseSensitivity,
                  value => updateSettings('controls', 'mouseSensitivity', value)
                )}
              </div>
            )}

            {/* UI */}
            {activeTab === 'ui' && (
              <div>
                {renderSelect(
                  t('settingsPanel.ui.theme'),
                  settings.ui.theme,
                  [
                    { value: 'dark', label: t('settingsPanel.ui.themeDark') },
                    { value: 'light', label: t('settingsPanel.ui.themeLight') },
                    { value: 'auto', label: t('settingsPanel.ui.themeAuto') },
                  ],
                  value => updateSettings('ui', 'theme', value)
                )}

                {renderSelect(
                  t('settingsPanel.ui.language'),
                  settings.ui.language,
                  [
                    { value: 'en-US', label: t('settingsPanel.ui.langEN') },
                    { value: 'zh-CN', label: t('settingsPanel.ui.langZH') },
                  ],
                  value => {
                    updateSettings('ui', 'language', value as any);
                    // 同步更新全局语言
                    if (value === 'en-US' || value === 'zh-CN') setLang(value);
                  }
                )}

                {renderSelect(
                  t('settingsPanel.ui.notificationPosition'),
                  settings.ui.notificationPosition,
                  [
                    { value: 'top-right', label: t('settingsPanel.ui.posTR') },
                    { value: 'top-left', label: t('settingsPanel.ui.posTL') },
                    {
                      value: 'bottom-right',
                      label: t('settingsPanel.ui.posBR'),
                    },
                    {
                      value: 'bottom-left',
                      label: t('settingsPanel.ui.posBL'),
                    },
                  ],
                  value => updateSettings('ui', 'notificationPosition', value)
                )}

                {renderCheckbox(
                  t('settingsPanel.ui.showAdvancedStats'),
                  settings.ui.showAdvancedStats,
                  checked => updateSettings('ui', 'showAdvancedStats', checked)
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="game-settings-panel__footer">
            <button
              onClick={resetSettings}
              className="game-settings-panel__reset-btn"
              title={t('settingsPanel.actions.resetToDefault')}
              aria-label={t('settingsPanel.actions.resetToDefault')}
            >
              {t('settingsPanel.actions.resetToDefault')}
            </button>

            <div className="game-settings-panel__footer-actions">
              <button
                onClick={onClose}
                className="game-settings-panel__cancel-btn"
                title={t('settingsPanel.actions.cancel')}
                aria-label={t('settingsPanel.actions.cancel')}
              >
                {t('settingsPanel.actions.cancel')}
              </button>

              <button
                onClick={saveSettings}
                disabled={!hasChanges}
                className={`game-settings-panel__save-btn ${
                  hasChanges
                    ? 'game-settings-panel__save-btn--enabled'
                    : 'game-settings-panel__save-btn--disabled'
                }`}
                title={t('settingsPanel.actions.save')}
                aria-label={t('settingsPanel.actions.save')}
              >
                {t('settingsPanel.actions.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
