# GameTP �?可复制的桌面游戏模板

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![CodeQL](https://github.com/OWNER/REPO/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/OWNER/REPO/actions/workflows/codeql.yml)
[![SBOM](https://img.shields.io/badge/SBOM-CycloneDX-blue)](#)
[![Windows Only](https://img.shields.io/badge/Platform-Windows--only-0078D6)](#)

注意：将上面�?OWNER/REPO 替换为你仓库的真实路径�?
- 技术栈：Electron + React 19 + Phaser 3 + Vite + TypeScript
- 已内置：ADR、Base‑Clean、CI 工作流、E2E/单测、安全门禁、协议安全（app://�?
## 快速开�?- 90 秒上手：�?`docs/howto/Quickstart.md`
- 贡献者指南：�?`AGENTS.md`

- Windows-only Guide: `docs/maintainers/WINDOWS_ONLY_GUIDE.md`
## 常用脚本
- 初始化模板：`npm run init:template -- --interactive`
- 模板体检：`npm run template:doctor`
- 本地开发：`npm run dev` / `npm run dev:electron`
- 构建与熔断：`npm run build:win:dir` �?`npm run security:fuses:prod`
- 单测 / E2E：`npm run test:unit` / `npm run test:e2e:smoke`

## 安全与治�?- 依赖风险：Snyk + audit‑ci（主干阻断），报告在 CI 构件�?- 体积门禁：size‑limit + Summary；建议稳定后收紧阈�?- 代码扫描：CodeQL（push/PR 自动运行�?
## 性能阈值变量（可选）
- 在仓�?Settings �?Variables 中设置如下值（用于 CI 的性能冒烟摘要）：
  - `START_TTI_WARN_MS`: 默认 3000（启动至首窗 DOMContentLoaded 警告阈值，毫秒�?  - `START_TTI_FAIL_MS`: 默认 5000（失败阈值，当前仅标红提示不阻断�?  - `SCENE_SWITCH_WARN_MS`: 默认 400（场景切换代�?警告阈值，毫秒�?  - `SCENE_SWITCH_FAIL_MS`: 默认 800（失败阈值，当前仅标红提示不阻断�?- 这些值会�?CI �?“Perf smoke summary (Windows)�?步骤生效并写�?Job Summary�?
## 常见问题（FAQ�?1) Windows �?E2E 失败（Playwright 依赖�?   - 运行 `npx playwright install --with-deps`，再�?`npm run test:e2e:smoke`�?2) 文档/脚本中文乱码�?BOM 问题
   - 执行 `npm run template:doctor` 检查；CI 已配�?BOM/ASCII 守卫，必要时运行 `node scripts/ci/fix-bom.cjs`�?3) SENTRY_DSN 未设�?   - 本地/PR 可以为空；需�?Release Health 时在仓库 Secrets 配置 `SENTRY_*`�?4) Electron 入口缺失（dist‑electron/electron/main.js�?   - 先执�?`npm run build`（或 `build:win:dir`）；测试/启动脚本依赖构建产物�?5) 产物守护失败（dist/** 被跟踪）
   - `git rm -r --cached dist dist-electron`，确�?`.gitignore` 已包含对应目录�?6) size‑limit 波动较大
   - 锁定依赖、保�?deterministic 构建；基线稳定后�?`.size-limit.json` 下调阈值�?7) Fuses 在开发跳�?   - 开发模式跳过是预期行为；生产需先打包（`build:win:dir`）再执行 `security:fuses:prod`�?8) CodeQL 报告误报
   - �?Security �?Code scanning alerts 查看；可按规则抑制并�?PR 说明理由�?
## 体积/性能豁免策略（仅在确有必要时使用�?- 体积：PR 如需临时豁免，请添加标签 `size-waive`，并在描述中说明原因与回收计划（例如后续拆分 vendor）�?- 性能：如触发 [WARN]/[FAIL]，请�?PR 描述附一次本地复测结果与 CI 链接；main 分支当前为“轻阻断+重试一次”�?
## 启用 Windows 签名（Azure Trusted Signing�?- 模板默认不开启签名；如需对外分发，建议开启签�?时间戳�?- 步骤（Release workflow 已放占位，默认关闭）�?  1) 在仓�?Secrets 配置：`AZURE_KV_VAULT_URL`、`AZURE_KV_TENANT_ID`、`AZURE_KV_CLIENT_ID`、`AZURE_KV_CLIENT_SECRET`、`AZURE_KV_CERT_NAME`
  2) （可选）在仓�?Variables 配置：`WINDOWS_TSA_URL`（默�?`http://timestamp.digicert.com`�?  3) �?Release 运行时设�?`SIGN_WINDOWS: true` 即可启用签名�?`signtool verify`
- 详见：`docs/maintainers/WINDOWS_SIGNING.md`


