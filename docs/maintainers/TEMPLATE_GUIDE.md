# Template Guide (Windows)

本指南说明如何将本仓库作为“游戏开发模板”复用到新项目。正文中文阐述；文件名为英文以便跨工具识别。

## 初始化（Python 一键脚本）

- 最低版本：Python 3.10+（Windows 推荐使用 `py -3` 调用）
- 命令示例：

```
py -3 scripts/python/init_project.py --name my-game \
  --product-name "My Game" \
  --description "My Electron + React + Phaser template game" \
  --domain-prefix mygame \
  --sentry-dsn "https://<key>@sentry.io/<project>"
```

- 作用：
  - 修改 `package.json` 的 `name`、`productName`、`description`。
  - 可选替换占位符：`${DOMAIN_PREFIX}`、`process.env.SENTRY_DSN`、默认产品名“Game TP”。
  - 产生变更清单：`logs/<YYYY-MM-DD>/init/init-summary.json`。

## i18n（内置骨架）

- 资源文件：`src/i18n/en-US.json`、`src/i18n/zh-CN.json`
- Provider 与 Hook：`I18nProvider` 与 `useI18n()`（见 `src/i18n`）
- 用法：
  - 在 `src/main.tsx` 中已包裹 `<I18nProvider>`。
  - 组件中：
    ```ts
    import { useI18n } from '@/i18n';
    const t = useI18n();
    const title = t('saveManager.title');
    const label = t('saveManager.level', { lv: 10 });
    ```
  - 语言切换：默认跟随 `navigator.language`，可在运行时调用 `setLang('en-US'|'zh-CN')`，存储于 `localStorage`。

## 质量门禁与日志

- 本模板提供 Python 脚本 `scripts/python/run_checks_and_log.py`：
  - 运行 `typecheck` 与单元测试，输出到 `logs/<YYYY-MM-DD>/refine/`。
  - Windows 仅用 Python/Node，不依赖 PowerShell。

## 安全与 Electron 基线

- 预设 `contextIsolation=true`、`sandbox=true`、`nodeIntegration=false`。
- CSP：开发环境通过响应头宽松、生产通过 `<meta http-equiv="Content-Security-Policy">` 严格模式。

## 复用建议

- 首次复用后立即运行：
  - `npm ci`
  - `npx playwright install`
  - `py -3 scripts/python/run_checks_and_log.py`
- 按需启用：Sentry DSN、发布签名（Windows）。

