# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

GLM Key Monitor — 智谱 AI API 使用量监控 VS Code 扩展。实时显示 Token 消耗、配额进度、多模型并发测速。

## 常用命令

```bash
npm run compile    # 编译 TypeScript → out/
npm run watch      # 监听模式开发
npm run package    # 打包 .vsix（使用 @vscode/vsce）
```

无测试框架、无 linter。TypeScript 严格模式编译即为主要检查手段。

## 架构

```
extension.ts (入口，注册命令 & 定时刷新)
  ├── apiClient.ts    → 智谱 API 请求层（fetch，base: open.bigmodel.cn）
  ├── dataParser.ts   → 配额计算 & 进度条 & 颜色编码
  ├── statusBar.ts    → VS Code 状态栏 UI
  ├── keyStorage.ts   → globalState 存储 API Key
  ├── webviewPanel.ts → 详情面板（632 行，最大模块，内联 HTML/CSS/JS）
  └── speedTest.ts    → 多线程模型测速（SSE 流式解析）
```

**VS Code 命令**：`setKey`、`refresh`、`showUsageDetails`

**API 端点**：
- `/api/monitor/usage/quota/limit` — Token 配额
- `/api/monitor/usage/model-usage` — 模型用量
- `/api/monitor/usage/tool-usage` — 工具用量
- `/api/anthropic/v1/messages` — 测速端点

## 开发注意事项

- 零运行时依赖，仅用 Node 内置 fetch 和 VS Code API
- UI 文案全中文硬编码，无 i18n
- tsconfig 开启 strict + noUnusedLocals/Parameters/ImplicitReturns
- webviewPanel.ts 通过字符串模板生成前端代码，修改 UI 时注意转义
- 测速功能支持 1-8 线程并发，使用 AbortController 支持取消
