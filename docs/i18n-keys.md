# i18n Keys（模板说明）

本文档列出模板内已约定的 i18n 命名空间与键，并给出使用示例，便于后续在新项目中统一扩展与翻译。文件名使用英文，正文为中文。

## 命名空间与键清单（SSoT）

- controlPanel
  - pause/resume/save/saving/load/restart
  - confirmRestart/statusProcessing/statusRunning/statusPaused
  - quickSave/quickLoad
  - hintEsc/hintF5/hintF9
  - titlePause/titleResume/titleSave/titleLoad/titleRestart/titleQuickSave/titleQuickLoad
  - ariaPause/ariaResume/ariaSave/ariaLoad/ariaRestart/ariaQuickSave/ariaQuickLoad

- notifications
  - levelUpTitle/levelUpMessage/lowHealthTitle/lowHealthMessage
  - errorTitle/itemTitle/close/clearAll

- interface
  - settings/saveManager/guildManager
  - titleSettings/titleSaveManager/titleGuildManager
  - loading/loadingSubtitle/errorClose
  - debug/state/position/shortcuts

- statusPanel
  - title/health/score/level
  - inventory/inventoryEmpty
  - position/id/timestamp
  - expand/collapse

- settingsPanel
  - title
  - tabs.graphics/tabs.audio/tabs.gameplay/tabs.controls/tabs.ui
  - actions.close/actions.resetToDefault/actions.cancel/actions.save/actions.rebinding/actions.confirmReset
  - graphics.quality/low/medium/high/fullscreen/vsync/showFPS
  - audio.muted/masterVolume/musicVolume/sfxVolume
  - gameplay.difficulty/easy/medium/hard/autoSave/autoSaveInterval/showNotifications/showTutorials
  - controls.keyboard/controls.mouseSensitivity/controls.labels.moveUp|moveDown|moveLeft|moveRight|action|pause
  - ui.theme/ui.themeDark/ui.themeLight/ui.themeAuto
  - ui.language/ui.langEN/ui.langZH
  - ui.notificationPosition/ui.posTR/ui.posTL/ui.posBR/ui.posBL
  - ui.showAdvancedStats
  - notify.saved/notify.saveFailed

> 规范：所有新键必须同时出现在 `src/i18n/en-US.json` 与 `src/i18n/zh-CN.json`，并通过 `src/__tests__/i18n-keys.spec.ts` 的键覆盖校验。

## 使用示例

在组件中使用 `useI18n()`：

```tsx
import { useI18n } from '@/i18n';

export function Example() {
  const t = useI18n();
  return (
    <button title={t('controlPanel.titleSave')} aria-label={t('controlPanel.ariaSave')}>
      {t('controlPanel.save')}
    </button>
  );
}
```

切换语言（例如在设置面板）：

```tsx
import { useLang } from '@/i18n';

const { setLang } = useLang();
setLang('zh-CN');
```

## 翻译约定

- 格式占位：使用 `{{name}}`，例如 `Score {{score}}`。
- 仅在必要时使用标点全角形式（中文场景）；英文保持半角。
- 变更键名前，评估影响范围，并同步更新键覆盖测试与文档。

## 关联 ADR

- ADR-0010-internationalization：确立国际化策略与 Provider/资源形态
- ADR-0005-quality-gates：新增键覆盖测试作为质量门禁的一部分

