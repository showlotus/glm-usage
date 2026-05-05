import * as vscode from 'vscode'
import { QuotaStatus, renderTemplate, formatResetTime } from './dataParser'

export interface QuotaDisplayState {
  type: 'quota'
  status: QuotaStatus
  template: string
}

export interface ErrorDisplayState {
  type: 'error'
  message: string
}

export interface EmptyDisplayState {
  type: 'empty'
  message: string
}

export type DisplayState = QuotaDisplayState | ErrorDisplayState | EmptyDisplayState

/** 创建状态栏项 */
export function createStatusBarItem(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  item.command = 'glmUsage.refresh'
  return item
}

/** 生成字符进度条，已使用 █ 未使用 ░ */
function textBar(percentage: number, width: number = 30): string {
  if (percentage < 0) return ''
  const filled = Math.max(percentage > 0 ? 1 : 0, Math.round((percentage / 100) * width))
  const empty = width - filled
  return '█'.repeat(filled) + '░'.repeat(empty) + ` 已使用 ${percentage}%`
}

/** 生成 Copilot 风格的 MarkdownString tooltip */
function buildTooltip(status: QuotaStatus): vscode.MarkdownString {
  const md = new vscode.MarkdownString(undefined, true)
  md.isTrusted = {
    enabledCommands: ['glmUsage.refresh', 'glmUsage.setKey', 'glmUsage.deleteKey'],
  }
  md.supportThemeIcons = true
  md.supportHtml = true

  md.appendMarkdown(`\n\n**GLM Usage**\n\n`)
  // md.appendMarkdown(`Level: ${status.level.replace(/(^.)/, $0 => $0.toUpperCase())}`)

  // 卡片 1: 每 5 小时
  md.appendMarkdown('---\n\n')
  md.appendMarkdown(
    `**每 5 小时使用额度**（重置于 ${formatResetTime(status.hourly.nextResetTime)}）\n`,
  )
  md.appendCodeblock(textBar(status.hourly.percentage))

  // 卡片 2: 每周
  if (status.weekly.percentage >= 0) {
    md.appendMarkdown('---\n\n')
    md.appendMarkdown(
      `**每周使用额度**（重置于 ${formatResetTime(status.weekly.nextResetTime)}）\n`,
    )
    md.appendCodeblock(textBar(status.weekly.percentage))
  }

  // 卡片 3: MCP 月度
  if (status.mcp.percentage >= 0) {
    md.appendMarkdown('---\n\n')
    md.appendMarkdown(`**MCP 每月额度**（重置于 ${formatResetTime(status.mcp.nextResetTime)}）\n`)
    md.appendCodeblock(textBar(status.mcp.percentage))
  }

  // md.appendMarkdown('---\n\n')
  // md.appendMarkdown(
  //   '[$(refresh) 刷新](command:glmUsage.refresh)　　[$(key) 设置 Key](command:glmUsage.setKey)　　[$(trash) 删除 Key](command:glmUsage.deleteKey)',
  // )

  // md.appendMarkdown('---\n')

  return md
}

/** 根据显示状态更新状态栏 */
export function updateStatusBar(item: vscode.StatusBarItem, state: DisplayState): void {
  switch (state.type) {
    case 'quota': {
      item.command = 'glmUsage.refresh'
      item.text = renderTemplate(state.template, state.status)
      item.tooltip = buildTooltip(state.status)
      item.color = undefined
      break
    }
    case 'error': {
      item.command = 'glmUsage.refresh'
      item.text = `GLM: ${state.message}`
      item.tooltip = 'GLM API Key 使用量监控'
      item.color = undefined
      break
    }
    case 'empty': {
      item.command = 'glmUsage.setKey'
      item.text = `GLM: ${state.message}`
      item.tooltip = '点击设置 API Key'
      item.color = undefined
      break
    }
  }
}
