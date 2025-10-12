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
  - 修改 `package.json` 的 `name`、`productName`、`description`
  - 可选替换占位符：`${DOMAIN_PREFIX}`、`process.env.SENTRY_DSN`、默认产品名“Game TP”
  - 产生变更清单：`logs/<YYYY-MM-DD>/init/init-summary.json`

## i18n（内置骨架）

- 资源文件：`src/i18n/en-US.json`、`src/i18n/zh-CN.json`
- Provider/Hook：`I18nProvider`、`useI18n()`（见 `src/i18n`）
- 用法：
  - 在 `src/main.tsx` 中已包裹 `<I18nProvider>`
  - 组件中：
    ```ts
    import { useI18n } from '@/i18n';
    const t = useI18n();
    const title = t('saveManager.title');
    const label = t('saveManager.level', { lv: 10 });
    ```
  - 语言切换：默认跟随 `navigator.language`，可在运行时调用 `setLang('en-US'|'zh-CN')`，存储于 `localStorage`

## CI 预修复（Pre-Fix）开关与日志

- 预修复内容（Windows-only，默认非阻断）：
  - Workflows ASCII：`.github/actions/workflows-ascii-prefx`（修复非 ASCII、BOM、EOL、TAB）
  - Actionlint 预检：`.github/actions/actionlint-prefx`（先 ASCII 修复，再 actionlint/fallback）
  - ESLint 预修复：`.github/actions/eslint-prefx`（调用 `scripts/python/fix_eslint.py`，含 Prettier）
- 环境开关（workflow 顶层 `env` 已配置）：
  - `CI_PREFX_DISABLE='1'` 关闭所有预修复
  - `CI_PREFX_STRICT='1'` 打开严格模式（预修复失败将阻断）
- 日志与工件（Artifacts）：
  - 本地落盘：`logs/<YYYY-MM-DD>/<module>`（module 为 `ascii`/`actionlint`/`eslint`）
  - `ci.yml/quality-gates` 会上传 ESLint 预修复日志为 artifact：`eslint-pre-fix-logs`

## 本地验证与常用脚本（Windows）

- 一键检查：
  - `py -3 scripts/python/run_checks_and_log.py`（typecheck + unit + i18n E2E）
- 独立预修复/扫描：
  - 工作流 ASCII 修复：`npm run workflows:ascii:fix`（或 `:scan`）
  - actionlint 预检：`npm run workflows:actionlint:fix`（或 `:scan`）
  - ESLint 自动修复：`npm run lint:eslint:fix`

## 安全与 Electron 基线

- 预设 `contextIsolation=true`、`sandbox=true`、`nodeIntegration=false`
- CSP：开发环境响应头宽松、生产通过 `<meta http-equiv="Content-Security-Policy">` 严格模式

## 复用建议

- 首次复用后建议：
  - `npm ci`
  - `npx playwright install`
  - `py -3 scripts/python/run_checks_and_log.py`
- 按需启用：Sentry DSN、Windows 发布签名

