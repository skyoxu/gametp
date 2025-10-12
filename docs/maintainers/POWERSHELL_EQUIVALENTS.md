# PowerShell 等效命令速查（Windows-only）

以下为常见 Linux 命令在 Windows PowerShell 下的等效写法。用于将文档/脚本从 bash 迁移到 pwsh。

- 删除目录（递归强制）
  - bash: `rm` + `-rf node_modules dist`
  - pwsh: `Remove-Item -Recurse -Force node_modules, dist`
- 复制目录（递归）
  - bash: `cp` + `-r src/assets dist/assets`
  - pwsh: `Copy-Item -Recurse src/assets dist/assets`
- 移动/重命名
  - bash: `mv` + `dist/app.exe release/app.exe`
  - pwsh: `Move-Item dist/app.exe release/app.exe`
- 列目录
  - bash: `ls` + `-la`
  - pwsh: `Get-ChildItem -Force`
- 查找文本
  - bash: `grep` + `-E "pattern"` + `file.txt`
  - pwsh: `Select-String -Pattern "pattern" file.txt`
- 文本替换（就地）
  - bash: `sed` + `-i "s/old/new/g"` + `file.txt`
  - pwsh: `(Get-Content file.txt) -replace 'old','new' | Set-Content file.txt`
- 导出环境变量（当前进程）
  - bash: `export` + `SENTRY_AUTH_TOKEN=xxx`
  - pwsh: `$env:SENTRY_AUTH_TOKEN = 'xxx'`
- 睡眠/等待
  - bash: `sleep` + `10`
  - pwsh: `Start-Sleep -Seconds 10`
- 文件头/尾
  - bash: `head` + `-n 50 file.txt` / `tail` + `-f file.txt`
  - pwsh: `Get-Content file.txt -TotalCount 50` / `Get-Content file.txt -Tail 100 -Wait`
- 程序位置
  - bash: `which` + `node`
  - pwsh: `(Get-Command node).Source`
- 符号链接（需要开发者模式/管理员）
  - bash: `ln` + `-s target link`
  - pwsh: `New-Item -ItemType SymbolicLink -Path link -Target target`

提示：在 CI 工作流中，统一使用 `shell: pwsh` 并用 `Out-File -Encoding utf8NoBom` 输出含中文的 Step Summary。

## 多文件搜索/替换示例

- 递归搜索文本（等效 Linux `grep` + `-r pattern dir`）
  - pwsh: `Select-String -Pattern "pattern" -Path dir\**\* -Recurse`
- 多文件就地替换（等效 Linux `sed` + `-i`）
  - pwsh:
    ```powershell
    Get-ChildItem -Recurse -Filter *.md | ForEach-Object {
      $raw = Get-Content -Raw $_.FullName
      $new = $raw -replace 'old','new'
      if ($new -ne $raw) { Set-Content $_.FullName -Value $new -Encoding UTF8 }
    }
    ```
