# 新项目初始化摘要

- 目标目录: C:\buildgame\gametp
- 项目名: gametp
- 产品名: Game TP
- PRD-ID: PRD-GameTP
- Domain Prefix: gametp

后续步骤（Windows）：

- 进入目标目录：`cd <target>`
- 安装依赖：`npm install`
- 安装 Playwright 运行时：`npx playwright install`（Windows 无需 --with-deps）
- 本地开发：`npm run dev` 与 `npm run dev:electron`
- 运行质量门禁：`npm run guard:ci`
