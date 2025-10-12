# Pull Request 模板

## 📋 变更说明

- 简要说明本次 PR 的目的和核心改动。

## 📖 ADR 引用（必填）

- [ ] ADR-0001: 技术栈选型 — 关联说明：
- [ ] ADR-0002: Electron 安全基线 — 关联说明：
- [ ] ADR-0003: 可观测性与发布健康 — 关联说明：
- [ ] ADR-0004: 事件总线与契约 — 关联说明：
- [ ] ADR-0005: 质量门禁 — 关联说明：
- [ ] ADR-0006: 数据存储 — 关联说明：
- [ ] ADR-0007: 端口适配器 — 关联说明：
- [ ] ADR-0008: 部署发布 — 关联说明：
- [ ] ADR-0009: 跨平台 — 关联说明：
- [ ] ADR-0010: 国际化 — 关联说明：
- [ ] 其他：

> 如本次 PR 修改/新增了 ADR，请在此补充链接与变更说明。

## 🏗️ 技术实现

- 核心改动文件：
- 接口 / 类型 / 事件：
  - [ ] 更新或新增 `src/shared/contracts/**`
  - [ ] 事件命名遵循 `${DOMAIN_PREFIX}.<entity>.<action>`
  - [ ] TypeScript 类型完整（若使用 `any` 需注明原因）

## 🧪 测试覆盖

- 单元测试：
  - [ ] 更新或新增 `tests/unit/**`
  - [ ] 覆盖率满足门禁要求
- E2E 测试：
  - [ ] 更新或新增 `tests/e2e/**`
  - [ ] 关键路径通过端到端验证
- 场景 / PRD 验证（如适用）：
  - [ ] `Test-Refs` 已更新
  - [ ] 验证用例与需求一致

## 🔐 安全与质量

- [ ] Electron 基线检查 (ADR-0002)
- [ ] `npm audit` / Snyk 通过或已在说明中豁免
- [ ] CSP / 敏感信息未被破坏
- [ ] ESLint / Prettier / TypeScript 通过
- [ ] 性能与体积无异常波动

## ✅ 提交前自查

- [ ] CI 全绿
- [ ] 引用至少 1 条已接受 ADR
- [ ] 自检代码
- [ ] 测试覆盖充分
- [ ] 文档 / Changelog 已更新（如需要）

---

## 🧰 常见 CI 告警速查

- `guard-artifacts` 失败：检查是否误提交了构建产物，必要时执行 `git rm -r --cached dist dist-electron`
- Snyk / audit-ci 失败：本地执行 `npm audit`、`npx audit-ci --high --critical` 评估并修复；如需豁免请在 PR 说明给出理由
