# GitHub App 安装与令牌生成（Windows）

> 目标：在本地安全配置 GitHub App（gametp-ai-bot），通过私钥生成 Installation Access Token，用于脚本/CI 调用。避免将私钥与短期令牌写入仓库。

- App ID：2032160
- Installation ID：87937917
- 私钥文件名（本地）：`gametp-ai-bot.pem`（请勿入库）

## 前置要求（Windows）

- Python ≥ 3.8（建议使用 `py -3`）
- 安装依赖（仅本机）：
  - `py -3 -m pip install "pyjwt[crypto]"`

## 私钥放置（不要入库）

- 推荐本机路径：`C:\secrets\gametp-ai-bot.pem`（自行创建 `C:\secrets`）
- 不要将 `.pem` 提交到仓库；如需在本地根目录临时放置，请确保 `.gitignore` 忽略。

## 生成 Installation Token（本地）

使用内置脚本（默认仅输出掩码，日志写入 `logs/`，不会落盘明文令牌）：

```
py -3 scripts/github_app_token.py \
  --app-id 2032160 \
  --installation-id 87937917 \
  --key-path C:\secrets\gametp-ai-bot.pem
```

- 若需直接获取明文令牌（敏感）：追加 `--print-token`
- 输出日志位置：`logs/<YYYY-MM-DD>/github-app/install-token-<HHMMSS>.json`（仅包含掩码与摘要信息）

## 常见错误排查

- `Missing --key-path`：确认本机私钥路径正确；不要把 `.pem` 放进仓库。
- `PyJWT is required`：先执行 `py -3 -m pip install "pyjwt[crypto]"`。
- `HTTP 401/403`：检查 App ID / Installation ID 是否匹配；或私钥是否为该 App 的最新下载版本。

## CI 集成（建议）

- 在 GitHub 仓库设置 `Settings > Secrets and variables > Actions`，新增：
  - `GITHUB_APP_ID`（值：2032160）
  - `GITHUB_INSTALLATION_ID`（值：87937917）
  - `GITHUB_APP_PRIVATE_KEY`（值：粘贴 `.pem` 全文；建议仅放到 Org/Env 级别并限制权限）
- 可在工作流中使用官方 `actions/create-github-app-token` 生成令牌，而不是自管脚本：

```
- uses: actions/create-github-app-token@v1
  id: app-token
  with:
    app-id: ${{ secrets.GITHUB_APP_ID }}
    private-key: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
    installation-id: ${{ secrets.GITHUB_INSTALLATION_ID }}
```

## 口径/合规

- 参考 ADR：
  - ADR-0008-deployment-release（CI/CD 与自动化）
  - ADR-0011-windows-only-platform-and-ci（Windows Only）
- 安全：令牌与私钥不入库；日志仅存掩码；必要时在 PR 附带操作日志路径（非敏感）。

