export type ChatRole = 'user' | 'assistant'

export type BlockStatus = 'running' | 'done'

export type ToolItemKind =
  | 'web_search'
  | 'web_fetch'
  | 'file_read'
  | 'file_write'
  | 'search_files'
  | 'grep'

export type ToolCallItem = {
  id: string
  itemKind: ToolItemKind
  summary: string
  status: BlockStatus
}

type BlockBase = {
  id: string
  status: BlockStatus
}

export type ThinkingBlock = BlockBase & {
  kind: 'thinking'
  content: string
}

export type BodyBlock = BlockBase & {
  kind: 'body'
  content: string
}

export type ToolCallBlock = BlockBase & {
  kind: 'tool_call'
  /** 工具族显示名（演示数据，不进 i18n） */
  toolName: string
  items: ToolCallItem[]
}

export type ShellBlock = BlockBase & {
  kind: 'shell'
  shellName: string
  command: string
}

export type SkillBlock = BlockBase & {
  kind: 'skill'
  skillName: string
  blocks: ChatBlock[]
}

export type McpBlock = BlockBase & {
  kind: 'mcp'
  mcpName: string
  functionName: string
  summary: string
}

export type ChatBlock =
  | ThinkingBlock
  | BodyBlock
  | ToolCallBlock
  | ShellBlock
  | SkillBlock
  | McpBlock

export type ChatBlockKind = ChatBlock['kind']

export type UserMessage = {
  id: string
  role: 'user'
  content: string
}

export type AssistantMessage = {
  id: string
  role: 'assistant'
  blocks: ChatBlock[]
  streaming?: boolean
}

export type ChatMessage = UserMessage | AssistantMessage

export function createUserMessage(content: string): UserMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content
  }
}

export function createAssistantPlaceholder(): AssistantMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    blocks: [],
    streaming: true
  }
}
