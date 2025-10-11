# GitHub Actions 编码最佳实践 - P2优化指南

## 概述

该文档给出在 Windows runner 上生成 Step Summary 与构建产物时的统一编码策略，确保所有输出满足 ADR-0011（Windows-only 平台策略）和 ADR-0005（质量门禁）要求，避免乱码、换行异常以及 Shell 混用造成的失败。

## 基础规则

### 1. Shell 选择优先级

```yaml
# ✅ 推荐：统一使用 pwsh
action:
  runs-on: windows-latest
  defaults:
    run:
      shell: pwsh
  steps:
    - name: 生成汇总
      run: |
        $summary = "## 构建汇总`n- 状态: ✅ 成功"
        $summary | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8NoBom -Append
```

- 默认 shell 指定为 `pwsh`；只有在调用历史脚本时才用 `cmd`，禁止 `bash`、`sh`。
- 在同一 job 内保持 shell 一致，减少编码切换导致的乱码风险。

### 2. Step Summary 模板

#### PowerShell 模板（推荐）

```yaml
- name: 写入 Step Summary
  shell: pwsh
  run: |
    $summary = @"
    ## ✅ 安全扫描结果
    - 依赖安全：通过
    - Electron 防护：通过
    - 代码质量：待关注

    ### 📊 覆盖率
    - Lines ≥ 92%
    - Branches ≥ 88%
    "@
    $summary | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8NoBom -Append
```

#### Node.js 模板

```yaml
- name: Append Step Summary (Node)
  shell: pwsh
  run: |
    node -e "
    import { appendFileSync } from 'node:fs';
    const summary = `## 🧪 测试结果
- Vitest: ✅
- Playwright: ✅`;
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '
', { encoding: 'utf8' });
    "
```

### 3. 构建文件编码规范

```yaml
- name: 生成构建信息
  shell: pwsh
  run: |
    $config = [ordered]@{
      version   = "${{ github.run_number }}"
      commit    = "${{ github.sha }}"
      generated = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
      platform  = 'windows'
    } | ConvertTo-Json -Depth 4

    New-Item -ItemType Directory -Force -Path config | Out-Null
    $config | Out-File -FilePath 'config/build-info.json' -Encoding utf8NoBom
```

```yaml
- name: 生成 manifest.json
  shell: pwsh
  run: |
    $artifact = [ordered]@{
      name = 'vitegame.exe'
      size = (Get-Item 'dist/vitegame.exe').Length
      hash = (Get-FileHash 'dist/vitegame.exe' -Algorithm SHA256).Hash
    }

    $manifest = [ordered]@{
      build_id = "${{ github.run_number }}"
      commit   = "${{ github.sha }}"
      artifacts = @($artifact)
    } | ConvertTo-Json -Depth 4

    $manifest | Out-File -FilePath 'dist/manifest.json' -Encoding utf8NoBom
```

## 常见问题排查

### 1. 误用 `shell: powershell`

```yaml
# ❌ 问题示例
- shell: powershell
  run: echo "含中文的摘要" > $env:GITHUB_STEP_SUMMARY
```

```yaml
# ✅ 修复示例
- shell: pwsh
  run: |
    "含中文的摘要" | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8NoBom -Append
```

### 2. 混用多种 Shell

```yaml
# ❌ 问题示例
jobs:
  build:
    runs-on: windows-latest
    steps:
      - shell: pwsh
        run: echo "pwsh output" >> $env:GITHUB_STEP_SUMMARY
      - shell: cmd
        run: echo cmd output >> %GITHUB_STEP_SUMMARY%
```

```yaml
# ✅ 修复示例
jobs:
  build:
    runs-on: windows-latest
    steps:
      - shell: pwsh
        run: |
          "pwsh output" | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8NoBom -Append
          "cmd output"  | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8NoBom -Append
```

## 检查清单

- [ ] job 默认 shell 设为 `pwsh`
- [ ] Step Summary 使用 `utf8NoBom`
- [ ] JSON/日志文件输出统一 `UTF-8`
- [ ] 未混用 `bash`/`sh`/`cmd`
- [ ] 中文内容在 Windows 下验证无乱码

## P2 优化对照表

| 场景 | 推荐 Shell | 编码方式 | 范例 |
| ---- | ---------- | -------- | ---- |
| Step Summary | `pwsh` | `Out-File -Encoding utf8NoBom` | Step Summary 模板 |
| 构建产物 | `pwsh` | `ConvertTo-Json + Out-File` | manifest 示例 |
| 自定义脚本 | `pwsh` | `Set-Content -Encoding UTF8` | 生成配置文件 |

---

> 本指南用于在 Windows-only 流水线中统一编码策略，保证文字与指标在 Step Summary 和构建产物中稳定可读。
