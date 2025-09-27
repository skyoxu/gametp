# Game Template 使用指南（Windows）

本指南帮助你基于 `gametp` 模板快速创建一个新游戏项目，继承同一套技术栈、CI 工作流、ADR 与 Base‑clean 规则，并在 Windows 环境“开箱即绿”。

## 1. 前置环境与快速启动

- Windows 10/11；PowerShell 7 建议
- Node.js ≥ 20：`node -v`
- Git；（可选）Python ≥3.11（如需扩展脚本）

初始化（首次）：

- 安装依赖：`npm ci`
- 安装 Playwright 运行时：`npx playwright install`（Windows 无需 `--with-deps`）
- 本地开发：`npm run dev`（前端）与 `npm run dev:electron`（Electron）
- 质量门禁：`npm run guard:ci`

日志：所有脚本与门禁日志默认写入 `logs/YYYY-MM-DD/<模块>/`，便于排障与归档。

## 2. 清理 PRD 痕迹（模板化必做）

模板仓库默认不包含具体 PRD，保留 Base 与 Overlay 骨架：

- 删除 `docs/prd_chunks/**` 与任何 `docs/PRD-*.md` / `docs/PRD-*.txt`
- 删除 `docs/architecture/overlays/PRD-*/**`（仅保留 `docs/architecture/overlays/PRD-<YOUR_PRODUCT>/08/_index.md`）
- 运行 `npm run guard:base`，确保 Base 无 PRD‑ID 及真实域前缀

## 3. Overlay 使用（08 章）

- 08 章仅放“功能纵切”：实体/事件/SLI/门禁/验收/测试占位；跨切面口径仍在 Base/ADR。
- 08 章正文**只引用** CH01/CH02/CH03 的口径，**禁止复制**阈值/策略到正文。
- 统一事件/DTO 类型放入 `src/shared/contracts/**`，文档与测试引用同一来源，避免口径漂移。

目录示例：

```
docs/
  architecture/
    overlays/
      PRD-<YOUR_PRODUCT>/
        08/
          _index.md
          08-功能纵切-<模块A>.md
          08-功能纵切-<模块B>.md
```

## 4. CI 工作流（Windows‑only 稳态）

- PR 默认：typecheck、lint、unit、smoke e2e、安全门（短版）、base‑clean
- 夜间/手动：SonarCloud、全量 e2e、性能、发布健康
- SonarCloud：仅在 `SONAR_TOKEN`、`SONAR_ORG`、`SONAR_PROJECT_KEY` 三者同时存在时执行
- Electron Security Gate：
  - 预构建 step（建议 12 分钟） + 构建产物存在性断言
  - 作业超时建议 60 分钟；run‑tests 内部构建兜底超时 `RUN_TESTS_BUILD_TIMEOUT_MS=600000`
  - 构建工件 `dist-electron/**` 复用（前置 job 上传、当前 job 下载）

## 5. ESLint/Prettier（Flat Config）

- 根配置 `eslint.config.js`（Flat Config v9）：
  - 顶层块覆盖 `**/*.{js,ts,tsx,mjs,cjs}`，使用 `tseslint.parser`
  - src 块维持严格；tests 块适度放宽（建议：关闭 `no-explicit-any`/`no-namespace`/`no-require-imports`；`no-empty-pattern` 降级 warn）
  - Prettier 选项在 `prettier/prettier` 规则内联，确保在子项目/模板中与 `.prettierrc` 一致
- 首次使用建议将 tests 的 `prettier/prettier` 设为 `warn`，`prettier --write` 一次后再升为 `error`

## 6. Electron 安全与入口一致性

- ADR‑0002：`nodeIntegration=false`、`contextIsolation=true`、`sandbox=true`；预加载仅白名单导出，参数校验；CSP 严格
- 统一入口：`dist-electron/electron/main.js`
  - 测试中使用 `tests/helpers/electronEntry.ts` 的 `assertElectronEntry()` 断言入口存在
  - Electron Security Gate job 下载工件或预构建后进行存在性断言，避免卡住

## 7. 可观测与 Sentry（ADR‑0003）

- main 与 renderer 尽早 init；Release Health 建议夜间/手动 gate 验证
- Secrets 不全（`SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT`）时默认跳过上传流程，避免开箱红

## 8. SonarCloud（可选）

- Windows‑only runner；Java 17；覆盖率 `coverage/lcov.info`
- 仅在 `SONAR_TOKEN`、`SONAR_ORG`、`SONAR_PROJECT_KEY` 存在时执行扫描与质量门禁

## 9. Playwright（Windows）

- 安装：`npx playwright install`
- e2e 项目建议：保留 smoke、安全与入口验证；重型场景放 `_examples/` 或按标签运行

## 10. 运行与日志

- `npm run dev`、`npm run dev:electron`；`npm run guard:ci`
- 日志：`logs/YYYY-MM-DD/<模块>/`（包括 e2e、observability、自检脚本等）

## 11. 约束与禁行

- `github_gpt` 目录：绝不扫描、提交、删除或上传（模板与脚手架均忽略）
- 08 章禁止复制阈值/策略；Base 必须保持“无 PRD 痕迹”

## 12. 常见问题与止损

- CI 卡在 Sonar：检查 `SONAR_TOKEN/SONAR_ORG/SONAR_PROJECT_KEY`；Secrets 不全则自动跳过
- Electron Security Gate 超时：提升预构建 step 的 `timeout-minutes`；作业级保持 60 分钟；确保 job 下载或预构建工件后做存在性断言
- lint:tests 红灯：临时将 tests 的 `prettier/prettier` 调为 `warn`，`prettier --write` 后恢复 `error`；或在 tests 块关闭 `no-explicit-any/no-namespace`

> 如需跨平台 runner，请新增 ADR 记录差异与策略，先本地验证再放宽 CI。
