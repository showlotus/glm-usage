# GLM Usage

[![VS Code Version](https://img.shields.io/badge/VS%20Code-%3E%3D1.85.0-blue)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

VS Code 扩展，监控智谱 AI (BigModel) API Key 的使用量，在状态栏实时显示多维度配额进度（5 小时 / 每周 / MCP 月度）和 Token 用量概览（当日 / 近 7 天 / 近 30 天），支持自定义模板和 Tooltip 详情。

![demo](https://github.com/showlotus/glm-usage/blob/main/res/demo2.png?raw=true)

## 功能特性

- **多维度配额监控** — 状态栏同时显示每 5 小时、每周、MCP 月度三个窗口的使用百分比，支持自定义模板
- **Token 用量概览** — Tooltip 中展示当日、近 7 天、近 30 天的 Token 消耗量，大数字自动转换为中文单位（万/亿）
- **Tooltip 详情** — 悬停状态栏显示字符进度条 + 重置时间，支持交互式命令按钮
- **API Key 管理** — 支持 Set / Delete，双写 globalState + settings.json，支持 VS Code Settings Sync 跨设备同步
- **自动刷新** — 支持 1/3/5/10/15/30/60 分钟间隔，窗口聚焦时自动刷新
- **智能重置检测** — 每 60 秒检测配额窗口是否已重置，自动触发 API 刷新
- **配置热生效** — 修改刷新间隔或状态栏模板后立即生效，无需重载

## 安装

从源码构建：

```bash
git clone https://github.com/showlotus/glm-usage.git
cd glm-usage
npm install
npm run compile
npm run package
code --install-extension glm-usage-0.0.1.vsix
```

或直接下载 [latest release](https://github.com/showlotus/glm-usage/releases) 的 `.vsix` 文件，在编辑器中 `Ctrl+Shift+P` → `Extensions: Install from VSIX...`。

## 使用方式

### 首次设置

1. 按 `Ctrl+Shift+P` → 输入 `GLM Usage: Set API Key`
2. 粘贴你的智谱 AI API Key（[获取地址](https://open.bigmodel.cn/usercenter/apikeys)）
3. 状态栏自动显示使用量

或点击右下角状态栏的 `GLM: 未设置 Key` 区域，自动触发设置流程。

### 命令

| 命令                        | 说明                 |
| --------------------------- | -------------------- |
| `GLM Usage: Set API Key`    | 设置 API Key         |
| `GLM Usage: Refresh Usage`  | 手动刷新使用量       |
| `GLM Usage: Delete API Key` | 删除已保存的 API Key |

### 配置

| 配置项                       | 默认值                                                               | 说明                                         |
| ---------------------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| `glmUsage.apiKey`            | `""`                                                                 | GLM API Key（支持 Settings Sync 跨设备同步） |
| `glmUsage.statusBarTemplate` | `"GLM: 每 5 小时 - ${HOURLY_PERCENT}% \| 每周 - ${WEEKLY_PERCENT}%"` | 状态栏显示模板                               |
| `glmUsage.refreshInterval`   | `10`                                                                 | 自动刷新间隔（分钟）                         |

### 模板变量

状态栏模板支持以下变量：

| 变量                | 说明                |
| ------------------- | ------------------- |
| `${HOURLY_PERCENT}` | 每 5 小时使用百分比 |
| `${WEEKLY_PERCENT}` | 每周使用百分比      |
| `${MCP_PERCENT}`    | MCP 月度使用百分比  |
| `${HOURLY_RESET}`   | 每 5 小时重置时间   |
| `${WEEKLY_RESET}`   | 每周重置时间        |
| `${MCP_RESET}`      | MCP 月度重置时间    |
| `${HOURLY_BAR}`     | 每 5 小时进度条     |
| `${WEEKLY_BAR}`     | 每周进度条          |
| `${MCP_BAR}`        | MCP 月度进度条      |

## 状态栏

默认显示：

```
GLM: 每 5 小时 - 68% | 每周 - 42%
```

悬停 Tooltip 展示 Token 用量概览和三个配额窗口的字符进度条：

```
Token 用量概览
当日: 12.3 万 Tokens
近 7 天: 123.5 万 Tokens
近 30 天: 1.2 亿 Tokens

每 5 小时使用额度（重置于 14:30）
████████░░░░ 已使用 68%

每周使用额度（重置于 05/12 00:00)
████░░░░░░░░ 已使用 35%

MCP 每月额度（重置于 06/01 00:00)
██░░░░░░░░░░ 已使用 15%
```

| 颜色 | 条件             |
| ---- | ---------------- |
| 绿色 | 使用量 < 70%     |
| 黄色 | 使用量 70% ~ 89% |
| 红色 | 使用量 >= 90%    |

## API 端点

扩展调用以下智谱 AI 开放平台接口：

| 接口                             | 用途                 |
| -------------------------------- | -------------------- |
| `/api/monitor/usage/quota/limit` | 查询配额限制         |
| `/api/monitor/usage/model-usage` | 查询模型 Token 用量  |

## 项目结构

```
src/
├── extension.ts      # 扩展入口，命令注册、定时器、刷新逻辑
├── apiClient.ts      # API 客户端，HTTP 请求 + 类型定义
├── dataParser.ts     # 数据解析，配额状态计算 + 模板渲染
├── statusBar.ts      # 状态栏 UI，Markdown Tooltip + Token 概览
├── webviewPanel.ts   # 详情面板（模型用量、工具用量、测速）
├── speedTest.ts      # 多线程模型测速（SSE 流式解析）
└── keyStorage.ts     # Key 持久化存储（globalState + settings.json）
```

## 开发

```bash
npm install
npm run compile    # 编译
npm run watch      # 监听模式
npm run package    # 打包 VSIX
```

按 `F5` 在 VS Code 扩展开发宿主中调试。

## 要求

- VS Code >= 1.85.0
- 智谱 AI (BigModel) API Key

## License

MIT
