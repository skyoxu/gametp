# Windows 代码签名（模板占位）

本模板默认不启用签名；当你准备对外分发时，强烈建议启用 Windows 代码签名并加时间戳，以提升 SmartScreen 信誉与用户信任。

## 方案建议（Windows‑only）

- 优先：Azure Key Vault + AzureSignTool（云托管证书，适合 CI）
- 备选：EV 代码签名证书（本地/签名机，CI 使用受限）
- 不建议：普通 PFX 长期存放在 CI（存在泄露风险）

## 在 Release 流程中启用

模板已在 .github/workflows/release.yml 放置占位步骤（默认关闭）。启用方式：

1. 在仓库 Secrets 配置：
   - AZURE_KV_VAULT_URL：Key Vault Vault URL（https://<vault>.vault.azure.net）
   - AZURE_KV_TENANT_ID：租户 ID
   - AZURE_KV_CLIENT_ID：客户端 ID（应用注册）
   - AZURE_KV_CLIENT_SECRET：客户端机密
   - AZURE_KV_CERT_NAME：证书名称（Key Vault 中的证书对象）
2. 在仓库 Variables（或 Secrets）配置（可选）：
   - WINDOWS_TSA_URL：时间戳服务地址（默认 http://timestamp.digicert.com）
3. 在 Release Workflow 运行时注入环境变量：
   - SIGN_WINDOWS: true（可作为 workflow_dispatch 输入或环境变量）

启用后，流水线将：

- 通过 dotnet tool install --global AzureSignTool 安装签名工具
- 对 dist-electron/\*_/_.exe|\*.msi 执行签名并添加时间戳
- 用 signtool.exe verify /pa /all 验证签名有效性（失败阻断）

## 常见问题

- SmartScreen 仍提示：
  - 新证书初期需要建立信誉；持续签名与发布能加速建立信任。
- EV vs 非 EV：
  - EV 证书在 SmartScreen 信誉建立速度更快，但需硬件密钥；云签名通常更适配 CI。
- 时间戳为什么重要：
  - 保证签名在证书过期后仍然有效，避免用户安装时出现警告。

## 本地验证

- signtool.exe verify /pa /all <file.exe>
- 在虚拟机或干净环境尝试安装，检查 SmartScreen 提示与“已验证发布者”。
