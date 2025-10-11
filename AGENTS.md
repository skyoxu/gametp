# Repository Guidelines

本仓库是 Windows only 的 Electron + React 19 + Phaser 3 + Vite 游戏模板，开箱即用、可复制。以下规范用于保障一致性与可维护性。
- **操作系统限定**：默认环境为 **Windows**。所有脚本/命令/依赖安装步骤必须提供 Windows 兼容指引（如 py/python 选择、Playwright 驱动安装等），**不用考虑其他系统环境**
- ***使用python***来进行工作，**不要使用powershell**
- 编写 .md文档时，正文也要用中文，但是**文件名**，**名词解释**可以使用英文
- **日志输出目录**：运行时与构建日志统一写入 logs/ 目录（按日期/模块分子目录），便于排障与归档
- **代码与改动**：遵循项目现有约定；先看周边文件/依赖
- **任务管理**：强制频繁使用任务规划/跟踪；逐项标记进行/完成，不要堆到最后

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

## 设计原则：

- AI 优先 + arc42 思维：按 不可回退 → 跨切面 → 运行时骨干 → 功能纵切 顺序

## 0 Scope & Intent

- **Base 文档**：`docs/architecture/base/**` —— 跨切面与系统骨干（01–07、09、10 章），**无 PRD 痕迹**（以占位 `${DOMAIN_*}` `${PRODUCT_*}` 表达）。
- **ADR**：Architecture Decision Record；**Accepted** 的 ADR 代表当前有效口径。
- **SSoT**：Single Source of Truth；01/02/03 章统一口径（NFR/SLO、安全、可观测性）。
- **Upstream**: BMAD v4 produces PRD + Architecture (arc42 overlays; CH01/CH03 at minimum; ADR-0001…0005 adopted, more as needed).

## Electron × Vite 脚手架（替换原“vanilla”）

- **推荐**：Vite + Electron标准集成，获得清晰的目录分离与热更新、调试与打包集成。
- 目录约定（当前项目结构）：
  ├─ src/ # React 19 + Tailwind v4 + Phaser 3 渲染进程
  ├─ electron/ # Electron 主进程与预加载脚本（ESM）
  │ ├─ main.ts # 主进程入口
  │ └─ preload.ts # contextBridge 白名单 API
  ├─ tests/ # Vitest单元测试 + Playwright E2E测试
  └─ index.html # 严格 CSP

## Project Structure

After initialization, the project will have:

- `src/` - Source code directory
- `public/` - Static assets
- `package.json` - Dependencies and scripts
- `docs/adr/` - ADR文件目录
- `docs/architecture/base/` - 综合技术文档清洁版本
- `docs/architecture/overlays/<PRD-ID>/` - 综合技术文档对应<PRD-ID>版本
- `architecture_base.index` - 综合技术文档清洁版本的索引

## Base / Overlay 目录约定

```
docs/
  architecture/
    base/                 # SSoT：跨切面与系统骨干（01–07、09、10）
      01-introduction-and-goals-v2.md
      02-security-baseline-electron-v2.md
      03-observability-sentry-logging-v2.md
      04-system-context-c4-event-flows-v2.md
      05-data-models-and-storage-ports-v2.md
      06-runtime-view-loops-state-machines-error-paths-v2.md
      07-dev-build-and-gates-v2.md
      08-crosscutting-and-feature-slices.base.md            # 仅模板/约束/占位示例
      09-performance-and-capacity-v2.md
      10-i18n-ops-release-v2.md
      11-risks-and-technical-debt-v2.md
      12-glossary-v2.md
    overlays/
      PRD-<PRODUCT>/
        08/
          08-功能纵切-<模块A>.md
          08-功能纵切-<模块B>.md
          _index.md
```

## Game Development Guidelines

- Use ES modules for code organization
- Leverage Vite's HMR for rapid development
- Consider using Canvas API or WebGL for rendering
- Structure game logic into modular components (scenes, entities, systems)
- Use TypeScript for better type safety and tooling
- Comments should concisely describe the function's purpose. Use a /\* \*/ block comment above each exported function to specify its parameters and return value.

## Common Patterns

- Game loop in `main.js` using `requestAnimationFrame`
- Component-based architecture for game objects
- Asset loading and caching strategies
- Input handling abstraction (keyboard, mouse, touch)
- State management for game scenes

## 技术栈选型

| 层次          | 选型             | 核心作用                   |
| ------------- | ---------------- | -------------------------- |
| 桌面容器      | **Electron**     | 跨平台打包 & Node API 集成 |
| 游戏引擎      | **Phaser 3**     | WebGL渲染 & 场景管理       |
| UI框架        | **React 19**     | 复杂界面组件开发           |
| 构建工具      | **Vite**         | Dev服务器 & 生产打包       |
| 开发语言      | **TypeScript**   | 全栈强类型支持             |
| 数据服务      | **SQLite**       | 高性能本地数据库           |
| 样式方案      | **Tailwind CSS** | 原子化CSS开发              |
| 演示部署      | Vercel           | CDN & Edge函数支持         |
| aiComputing   | **Web Worker**   | AI计算线程分离             |
| configStorage | **Local JSON**   | 配置文件存储               |
| communication | **EventBus**     | Phaser ↔ React通信        |

1. **React：强制 v19**（禁止 v18 及以下），若使用第三方库需确认兼容性
2. **Tailwind CSS：强制 v4**（禁止 v3 及以下），按 v4 配置方式执行
3. **模块系统：禁止 CommonJS**；前端/预加载/渲染一律使用 **ESM**
4. **TypeScript 优先**：默认以 TypeScript 实现；如因工具链限制必须使用 JS，需在 PR 说明中**写明原因与计划回迁**
5. **强类型约束**：数据结构应提供类型定义；如因探索性开发临时使用 any / 非结构化 JSON，需在代码处标注 TODO 与回迁计划，并在 PR 中说明

**除非计划中特别指明，否则不要引入其他库**

## 核心行为规则

1. 你会在对话输出完毕后选择适当的时机向用户提出询问，例如是否需要添加后端能力，是否打开预览，是否需要部署等
2. 交互式反馈规则：在需求不明确时主动与用户对话澄清，优先使用自动化工具 interactiveDialog 完成配置。执行高风险操作前必须使用 interactiveDialog 获得用户确认。保持消息简洁并用ASCII标记状态。
3. **Test-driven development must** - Never disable tests, fix them

## 1 Context Discipline (RAG Rules)

1. **凡会落地为代码/测试的改动，必须引用 ≥ 1 条 _Accepted_ ADR。**  
   若改动改变阈值/契约/安全口径：**新增 ADR** 或 **以 `Superseded(ADR-xxxx)` 替代旧 ADR**。

- Local sessions: prefer `claude --add-dir shards` to reference `@shards/*` paths directly.

2. **08 章（功能纵切）只放在 overlays**：
   - base 仅保留 `08-功能纵切-template.md` 模板与写作约束；**禁止**在 base 写任何具体模块内容。
   - 08 章**引用** 01/02/03 的口径，**禁止复制阈值/策略**到 08 章正文。事件命名规则：
     `\${DOMAIN_PREFIX}.<entity>.<action>`；接口/DTO 统一落盘到 `src/shared/contracts/**`。
3. **TS 强化约定**：
   - **类型定义位置**：公共 DTO/事件/端口类型一律放在 src/shared/contracts/\*\*，其他章节引用不复制。
   - **any 使用门槛**：出现 any 时，必须同时提供：// TODO: remove any | owner | due 注释 + Issue 链接 + 回迁计划。
   - **公共命名**：事件命名统一为 \${DOMAIN_PREFIX}.<entity>.<action>；模块展示标注 data-testid="<模块>-root" 以便 Playwright 选择器稳定。
4. Use **only**: `@architecture_base.index`, `@prd_chunks.index`, `@shards/flattened-prd.xml`, `@shards/flattened-adr.xml` for overlay‑related work. Do **not** rescan `docs/` or rebuild flattened XML.
5. Overlays: write to `docs/architecture/overlays/<PRD-ID>/08/`. 08章只写**功能纵切**（实体/事件/SLI/门禁/验收/测试占位）；跨切面规则仍在 Base/ADR。

---

## 4 Engineering Workstyle

- Small, green steps; learn from existing code; pragmatic choices; clarity over cleverness.
- TDD‑leaning flow: Understand → Test (red) → Implement (green) → Refactor → Commit (explain **why**, link ADR/CH/Issue/Task).
- When stuck (max 3 attempts): log failures; list 2–3 alternatives; question abstraction/scope; try the simpler path.

---

## 5 Technical Standards

### Architecture

- Composition over inheritance (DI), interfaces over singletons, explicit over implicit.

### Code Quality

- Every commit compiles, passes tests, and follows format/lint; new code adds tests; no `--no-verify`.

### Error Handling

- Fail fast with context; handle at the right layer; no silent catches.

---

## 6 Security & Privacy Baseline (Electron)

- `nodeIntegration=false`, `contextIsolation=true`, `sandbox=true`.
- Strict CSP: dev via response headers; packaged via `<meta http-equiv="Content-Security-Policy">`; no `'unsafe-inline'/'unsafe-eval'`; `connect-src` allow‑list (Sentry/API/etc.).
- Main‑process guards: window open/navigation/permission handlers; preload exports are **whitelist‑only** with parameter validation.

---

## 7 Observability & Release Health

- Sentry Releases + Sessions **must** be enabled to compute **Crash‑Free Sessions/Users**. Thresholds are env‑configurable; CI blocks below threshold.
- Logs are structured and sampled; scrub PII at SDK (preferred) and/or server policy.
- **Sentry init** in **Electron main and every renderer** at the earliest entry point.
- **Vite sourcemaps**: use `@sentry/vite-plugin` to create releases & upload source maps in CI.
- **Release gate**: only widen rollout if **Crash-free Sessions (24h) ≥ 99.5%** on pre-release/production.

---

## 8 输出格式与附带物（让“规范可执行”）

- 任何“可执行规范”（章节/Story/task）**必须附带**：
  1. **接口/类型/事件**的 TypeScript 片段（放入 `src/shared/contracts/**`）；
  2. **就地验收**测试片段（Vitest/Playwright Electron）。
- 08 章文档产出**必须**同步/创建 `Test-Refs` 对应的测试文件（可先放占位）。
- 事件/端口的类型与契约**统一引用**于 `src/shared/contracts/**`，避免口径漂移。
- 生成/审阅内容时，**先质疑再生成**：对潜在误解与边界条件优先提示，必要时提出替代方案或降级路线。

---

## 9 Quality Gates (CI/CD)

- Required checks (branch protection):
  - `playwright-e2e` (Electron smoke/security/perf)
  - `vitest-unit` (contracts & units)
  - `task-links-ajv` (ADR/CH back‑links)
  - `release-health` (Crash‑Free threshold)
  - (optional) `superclaude-review` (AI review notes exist)
- Pipeline: typecheck → lint → unit → e2e → task link validation → release‑health → package.
- Merges require **green** pipeline; “Require status checks” must be enabled on protected branches.

---

## 10 Definition of Done (DoD)

- [ ] Unit/E2E tests written and passing
- [ ] Code follows conventions; no lint/format warnings
- [ ] Commit messages clear; link ADR/CH/Issue/Task
- [ ] Matches Overlay acceptance checklist
- [ ] No stray TODOs (or reference issues)

---

## 11 Housekeeping

- Prefer Node scripts over bash for cross‑platform tasks.
- Keep slash commands project‑scoped; avoid broad reads.
- Use `--add-dir shards` to reference flattened XML/indexes when needed.
- Keep ADR log current; tasks/commits/PRs **must** back‑link ADR/CH/Overlay.

## 12 质量门禁（本地/CI 一致）

> 最小门禁以脚本方式固化，均可在本地与 CI 运行；阈值可通过环境变量覆盖。

- **脚本**（建议存在）：
  - `scripts/scan_electron_safety.mjs` —— 检查 BrowserWindow/Preload/CSP 是否符合基线
  - `scripts/quality_gates.mjs` —— 覆盖率（lines ≥90% branches ≥85%）
  - `scripts/verify_base_clean.mjs` —— Base 文档“清洁检查”（不得含 `PRD-ID:` 与真实域前缀）
- **统一入口**：在 `package.json` 中配置 `guard:ci`：
  ```json
  {
    "scripts": {
      "typecheck": "tsc - p tsconfig.json --noEmit",
      "lint": "eslint . --ext .ts,.tsx",
      "test:unit": "vitest run --coverage",
      "test:e2e": "playwright test",
      "guard:electron": ,
      "guard:quality": ,
      "guard:base": ,
      "guard:dup": "jscpd --threshold 2 --gitignore --pattern \"**/*.{ts,tsx,js}\"",
      "guard:complexity": "npx complexity-report -o reports/complexity.html src || exit 1",
      "guard:deps": "npx depcruise src --config .dependency-cruiser.cjs && npx madge --circular --extensions ts,tsx ./src",
      "guard:ci": "npm run typecheck && npm run lint && npm run test:unit && npm run guard:dup && npm run guard:complexity && npm run guard:deps && npm run test:e2e"
    }
  }
  ```
  **Duplication** (jscpd)—2% threshold as a firm fail line (tune per repo size)
  **Complexity (complexity-report/escomplex)**—enforce **Cyclomatic ≤ 10 / file average ≤ 5** (review the HTML report in CI)
  ### Dependency guards—no cross-layer shortcuts + no circular deps via dependency-cruiser and madge
  **Python**：如需 Python，请同时支持 py -3 -m pip 与 python -m pip；并在文档中标注最低版本。
  **Playwright**：在 Windows 上提供 npx playwright install --with-deps 的替代说明（某些依赖可省略 --with-deps）
  **Shell 脚本**：为关键脚本提供 PowerShell 版本（如 scripts/\*.ps1），或在 package.json 用 Node 脚本替代纯 Bash

---

## 13 默认 ADR 映射（可扩展）

- **ADR-0001-tech-stack**：技术栈选型 (React 19, Electron, Phaser 3, TypeScript, Vite)
- **ADR-0002-electron-security**：Electron安全基线 (CSP, nodeIntegration=false, contextIsolation=true)
- **ADR-0003-observability-release-health**：可观测性和发布健康 (Sentry, 崩溃率阈值, 结构化日志)
- **ADR-0004-event-bus-and-contracts**：事件总线和契约 (CloudEvents, 类型定义, 端口适配)
- **ADR-0005-quality-gates**：质量门禁 (覆盖率, ESLint, 性能阈值, Bundle大小)
- **ADR-0006-data-storage**：数据存储 (SQLite, 数据模型, 备份策略)
- **ADR-0007-ports-adapters**：端口适配器 (架构模式, 依赖注入, 接口设计)
- **ADR-0008-deployment-release**：部署发布 (CI/CD, 分阶段发布, 回滚策略)
- **ADR-0009-cross-platform**：跨平台 (Windows/macOS/Linux 支持, 原生集成)
- **ADR-0010-internationalization**：国际化 (多语言支持, 本地化流程, 文本资源管理)
- **ADR-0011-windows-only-platform-and-ci**：确立Windows-only平台策略
- **ADR-0015-performance-budgets-and-gates**：定义性能预算与门禁统一标准，包括P95阈值、Bundle大小限制和首屏优化策略

> 任何章节/Story 若改变上述口径，**必须**新增或 Supersede 对应 ADR。

---

## 14 写作前自检（内置检查清单）

- 目标文件属于 **base** 还是 **overlay**？（base 禁 PRD-ID，overlay 必带 PRD-ID 与 ADRs）
- 是否涉及 **Electron 安全、事件契约、质量门禁、Release Health**？若是，请**引用** ADR‑0002/0004/0005/0003。
- 08 章是否只**引用** 01/02/03 的口径（不复制阈值）？
- 是否附带 **TypeScript 契约片段** 与 **就地验收**（Vitest/Playwright）？
- PRD Front‑Matter 的 `Test-Refs` 是否已更新到新用例或占位用例？

---

## 15 PR 模板要求（最少需要在 `.github/PULL_REQUEST_TEMPLATE.md` 勾选）

- [ ] 更新/新增 `src/shared/contracts/**` 的接口/类型/事件。
- [ ] 更新/新增 `tests/unit/**`（Vitest）与 `tests/e2e/**`（Playwright Electron）。
- [ ] 涉及 PRD：Front‑Matter 的 `Test-Refs` 指向相应用例。
- [ ] 变更口径/阈值/契约：已新增或 _Supersede_ 对应 ADR 并在 PR 描述中引用。
- [ ] 附上 **E2E 可玩度冒烟** 的运行链接/截图
- [ ] 附上 **Sonar Quality Gate** 结果链接（新代码绿灯）
- [ ] 附上 **Sentry Release** 链接（用于回溯本次崩溃/错误）

---

## 16 版本约束与脚手架建议

- **Electron 集成**：优先使用 `electron-vite` 或 `vite-plugin-electron` 提供的主/渲染/预加载目录与热更；统一目录约定便于脚本扫描。

---

## 17 违例处理

- 缺失 `ADRs`、复制阈值进 08 章、Base 出现 PRD-ID、遗漏 `Test-Refs` 等：Claude/BMAD 应**拒绝写入**并返回“拒绝原因 + 自动修复建议 + 需要引用/新增的 ADR 清单”。
- 需要新增 ADR 时，自动生成 `docs/adr/ADR-xxxx-<slug>.md` 的 _Proposed_ 草案并提示审阅。

> **备注**：本 Rulebook 与项目中的脚本/模板、Base/Overlay 结构**强关联**。请保持这些文件存在且更新：  
> `scripts/scan_electron_safety.mjs` · `scripts/quality_gates.mjs` · `scripts/verify_base_clean.mjs` · `.github/PULL_REQUEST_TEMPLATE.md` · `docs/architecture/base/08-功能纵切-template.md`。

---

## 18 附录：最小 ADR 模板（Accepted）

```md
# ADR-000X: <title>

- Status: Accepted
- Context: <背景与动机；关联的 PRD-ID/章/Issue>
- Decision: <你做了什么决定；口径与阈值；适用范围>
- Consequences: <权衡与影响；与既有口径的关系；迁移注意>
- Supersedes: <可选：被替代的 ADR 列表>
- References: <链接/规范/实验数据>
```

**代码“坏味道”审查清单（代码评审必读）**
在编写/评审代码时，若发现以下“坏味道”，**必须**给出重构建议或请求改动：

- **僵化（Rigidity）**：小改动引发大量联动修改，说明耦合过高/抽象不当。
- **冗余（Redundancy）**：相同逻辑重复出现，建议抽取函数/组件或上移到共享模块。
- **循环依赖（Circular Dependency）**：模块相互依赖，影响重用与测试。
- **脆弱性（Fragility）**：改动 A 把看似无关的 B 弄坏，说明边界不清或隐藏依赖。
- **晦涩性（Obscurity）**：意图不明/命名混乱/结构杂糅，阅读成本高。
- **数据泥团（Data Clump）**：参数总是成团出现，应抽象为对象或类型。
- **不必要的复杂性（Needless Complexity）**：为简单问题引入过度抽象/通用框架。

**请在所有代码生成中严格遵循这些原则**
