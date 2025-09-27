# Repository Guidelines

本仓库是 Windows only 的 Electron + React 19 + Phaser 3 + Vite 游戏模板，开箱即用、可复制。以下规范用于保障一致性与可维护性。

## 项目结构
- `src/` 应用源码：`components/`、`game/`、`shared/`（contracts/services/middleware）。
- `electron/` 主进程与预加载脚本（TypeScript）。
- `tests/` 测试：`unit/`、`e2e/`、`perf/`。
- `scripts/` CI/发布/安全工具；`dist/`、`dist-electron/` 为构建产物（不入库）。

## 构建与开发命令
- `npm run dev` 启动 Vite；`npm run dev:electron` 构建并启动 Electron。
- `npm run build` 标准构建；打包：`npm run build:win:dir`。
- 测试：`npm run test:unit`、`npm run test:e2e`；覆盖率门禁：`npm run test:coverage:gate`。
- 体积：`npm run size` / `size:ci`；安全：`npm run security:check`；熔断：`npm run security:fuses:prod`。

## 代码风格
- TypeScript + ESM，缩进 2 空格；组件文件 `PascalCase.tsx`，工具/脚本 `kebab-case.ts`。
- ESLint 9 + Prettier 3；提交前修复所有错误：`npm run lint`、`npm run format:check`。

## 测试规范
- 单测使用 Vitest，命名 `*.spec.ts|*.test.ts`，放于 `tests/unit` 或模块旁的 `__tests__`。
- 端到端使用 Playwright（Windows runner），配置见 `playwright.config.ts`。
- 覆盖率阈值通过 `test:coverage:gate` 校验并在 CI 报告。

## 提交与 PR
- 遵循 Conventional Commits（如 `feat: add menu scene`）。
- CI 启用强制门禁：commitlint 未通过则阻断；PR 需附变更说明、关联 issue、必要截图/日志与测试说明。
- 如确需临时放宽体积门禁，请在 PR 打 `size-waive` 标签并写明回收计划。

## 安全与平台
- Electron 基线：`contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`；已接入 `app://` 协议并做 404/越权防护。
- 依赖与二进制安全：`npm run security:audit:gate`、Fuses（开发跳过、生产阻断）。
- Windows 签名（可选）：Release 工作流预留 Azure Trusted Signing 占位，见 `docs/maintainers/WINDOWS_SIGNING.md`。

## 贡献者提示
- 仅修改 `src/**`、`electron/**`、`tests/**`、`scripts/**`；勿改动构建产物与 `node_modules/`。
- Node 20.x；首次运行建议执行 `npx playwright install` 后再 `npm run test:e2e` 验证环境。

