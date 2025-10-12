# 快速开始（90 秒）

1. 初始化模板

```
npm run init:template -- --interactive
# 或指定参数：
npm run init:template -- --name=my-game --productName="My Game" --rename-scope=acme
```

2. 本地开发

```
npm run dev          # Vite 前端
npm run dev:electron # 构建后启动 Electron
```

3. 构建与安全熔断

```
npm run build:win:dir
npm run security:fuses:prod
```

4. 端到端冒烟（可选）

```
npm run test:e2e:smoke
```

5. 发布（示例）

- 推送 tag 触发 `.github/workflows/release.yml`，产物上传至构件库。
