import type { ChatBlock, ToolCallItem, ToolItemKind } from '@renderer/capabilities/task-chat/block-model'

export type DemoPath =
  | { type: 'root' }
  | { type: 'skill'; skillBlockId: string }

export type DemoEvent =
  | { op: 'append'; path: DemoPath; block: ChatBlock; delayMs?: number }
  | {
      op: 'patch'
      path: DemoPath
      blockId: string
      patch: Partial<ChatBlock> | ((block: ChatBlock) => ChatBlock)
      delayMs?: number
    }
  | {
      op: 'streamText'
      path: DemoPath
      blockId: string
      field: 'content' | 'summary' | 'command'
      text: string
      chunkSize?: number
      charDelayMs?: number
    }
  | {
      op: 'patchItem'
      path: DemoPath
      blockId: string
      itemId: string
      patch: Partial<ToolCallItem>
      delayMs?: number
    }

export function demoId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function toolItem(
  itemKind: ToolItemKind,
  summary: string,
  status: ToolCallItem['status'] = 'running'
): ToolCallItem {
  return { id: demoId('item'), itemKind, summary, status }
}

export const rootPath: DemoPath = { type: 'root' }
