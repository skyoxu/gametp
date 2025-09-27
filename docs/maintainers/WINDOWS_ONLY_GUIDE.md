# Windows-only 指南与示例

本模板为 Windows-only。以下提供 PowerShell 示例以替代常见的 bash 片段。

## 渐进发布（PowerShell）

```powershell
$ErrorActionPreference = 'Stop'
$VERSION = '1.2.3'
$PREV_VERSION = '1.1.0'

Write-Host "🚀 开始渐进发布 $VERSION"
Write-Host "📊 阶段 1: 5% 发布"
npm run release:stage:5
Start-Sleep -Seconds 600
if (-not (npm run release:health-check)) {
  Write-Warning "❌ 5% 阶段健康检查失败，执行回滚"
  npm run release:rollback:to-version -- dist/latest.yml artifacts/manifest.json $PREV_VERSION
  exit 1
}
Write-Host "✅ 5% 阶段健康度良好，继续下一阶段"
npm run release:stage:25
# ... 继续 50%、100% 等后续阶段
```

## 依赖安装（CI）

工作流和 Composite Actions 已统一使用 `pwsh`，无须 `bash`。本地如需强制清理并重装依赖：

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm ci
```

## 约束与门禁

- CI 设有 Windows-only 守卫：禁止 `shell: bash`、禁止非 Windows runner、禁止在仓库中引入 `*.sh`（白名单除外：`.husky/**`, `node_modules/**`, `dist*/**`, `logs/**`, `coverage/**`, `reports/**`, `test-results/**`）。
- 如需临时豁免（仅 PR）：添加标签 `windows-guard-waive` 或 `size-waive`，守卫会改为警告但不阻断。
