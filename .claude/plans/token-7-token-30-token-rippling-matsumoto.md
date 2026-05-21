# 在面板顶部添加 Token 用量概览卡片

## Context

用户需要在 webview 面板中**同时**展示今日、最近 7 天、最近 30 天的 Token 用量，便于一眼掌握消耗趋势。当前面板只展示用户所选时间范围的单一数值，无法同时对比多个周期。

## 方案

在报告顶部（配额限制区域之前）添加一个三列卡片式概览，固定展示三个时间维度的 Token 消耗。额外发起 3 个并行 API 请求获取数据，不影响现有时间范围选择器的详细数据展示。

## 修改文件

**仅修改 `src/webviewPanel.ts`**（`apiClient.ts`、`dataParser.ts` 无需改动）

### 1. 添加接口定义（约第 16 行）

```typescript
interface TokenSummary {
    today: number;
    last7d: number;
    last30d: number;
}
```

### 2. 提取 `pad2` 工具函数 + 新增 `getTodayStart`（约第 649 行）

将 `formatDateTime` 内的 `pad` 提取为模块级 `pad2` 函数，复用于 `getTodayStart`：

```typescript
function pad2(n: number): string {
    return n.toString().padStart(2, '0');
}

function getTodayStart(): string {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} 00:00:00`;
}
```

`formatDateTime` 改为调用 `pad2` 而非局部 `pad`。

### 3. 修改 `loadUsageData` 函数（第 195-219 行）

在现有 3 个 API 调用基础上，额外并行发起 3 个 `getModelUsage` 请求：

```typescript
const nowStr = formatDateTime(new Date());
const todayStart = getTodayStart();
const sevenDaysAgo = formatDateTime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
const thirtyDaysAgo = formatDateTime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

const [quotaResult, modelResult, toolResult, todayUsage, last7dUsage, last30dUsage] = await Promise.all([
    getQuotaLimit(apiKey),
    getModelUsage(apiKey, startTime, endTime),
    getToolUsage(apiKey, startTime, endTime),
    getModelUsage(apiKey, todayStart, nowStr),
    getModelUsage(apiKey, sevenDaysAgo, nowStr),
    getModelUsage(apiKey, thirtyDaysAgo, nowStr)
]);

const tokenSummary: TokenSummary = {
    today: todayUsage.code === 200 && todayUsage.data ? todayUsage.data.totalUsage.totalTokensUsage : -1,
    last7d: last7dUsage.code === 200 && last7dUsage.data ? last7dUsage.data.totalUsage.totalTokensUsage : -1,
    last30d: last30dUsage.code === 200 && last30dUsage.data ? last30dUsage.data.totalUsage.totalTokensUsage : -1,
};
```

将 `tokenSummary` 传入 `generateReportHtml`。

### 4. 修改 `generateReportHtml` 签名（第 472 行）

追加可选参数 `tokenSummary?: TokenSummary`。

### 5. 在 `<h1>` 标题之后、配额区域之前插入概览卡片（第 479 行）

```html
<div class="section token-summary">
  <h2>📊 Token 用量概览</h2>
  <div class="summary-cards">
    <div class="summary-card">
      <div class="summary-label">今日</div>
      <div class="summary-value">xxx,xxx</div>
      <div class="summary-unit">Tokens</div>
    </div>
    <!-- 最近 7 天 / 最近 30 天 同理 -->
  </div>
</div>
```

API 失败时显示 `--`（通过 `-1` 哨兵值判断）。

### 6. 添加 CSS 样式（`getCommonStyles` 函数内）

```css
.summary-cards { display: flex; gap: 12px; margin-top: 8px; }
.summary-card { flex: 1; text-align: center; padding: 12px 8px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; background: var(--vscode-editor-background); }
.summary-label { font-size: 13px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; }
.summary-value { font-size: 22px; font-weight: bold; }
.summary-unit { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
```

使用 VS Code CSS 变量，自动适配亮/暗主题。

## 设计决策

- **3 个独立 API 调用**：今日 ≠ 最近 24 小时（今日从零点算），且用户要求三个值同时可见，与时间范围选择器无关。6 个并行请求的总耗时 = 最慢的单个请求。
- **放置在配额区域之前**：Token 用量是最高频查看的指标，放在最上方无需滚动即可看到。
- **可选参数**：`tokenSummary` 为可选，`getErrorHtml` / `getLoadingHtml` 等调用无需改动。

## 验证

1. `npm run compile` 编译通过（TypeScript 严格模式）
2. 在 VS Code 中打开面板，确认顶部出现三列卡片，今日/7 天/30 天 Token 用量正确显示
3. 切换时间范围选择器（24 小时/7 天/30 天），确认概览卡片数据不受影响
4. 未设置 Key 时确认不显示概览卡片
