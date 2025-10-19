# ADR-0016: 升级 Node 运行时到 22.x

 - Status: Accepted
 - Context: 现有工程 `package.json` 中 `engines.node` 为 `>=20 <21`。本地与若干开发/Runner 环境已使用 Node 22.x，导致 `npm ci` 出现 EBADENGINE 警告并干扰 Windows CI 的 PowerShell 输出。升级 Node 版本可获得更好的 V8 性能、稳定的 npm 11 系列和更长的安全维护周期。
 - Decision: 将项目 Node 版本基线调整为 22.x。
   - `package.json.engines.node = ">=22 <23"`
   - CI 与文档后续同步到 Node 22.x（工作流中 `actions/setup-node` 的 `node-version` 将逐步从 `20.x` 升级为 `22.x`）。
   - 不改变其它栈选择（Electron/React/Phaser/Vite/TS 保持不变）。
 - Consequences:
   - 本地 Node 22.x 不再触发 EBADENGINE 警告；锁文件与二进制工具链以 22.x 行为为准。
   - 旧环境（Node 20.x）安装时将收到 engines 不匹配警告，建议开发者升级本地 Node。
   - 需要在 CI 中统一至 Node 22.x 以避免 engines 警告噪声；如需分阶段，可在过渡期保留个别 20.x Job（非阻断）。
 - References:
   - ADR-0005-quality-gates（门禁与流水线约束）
   - Node.js Releases LTS 周期
