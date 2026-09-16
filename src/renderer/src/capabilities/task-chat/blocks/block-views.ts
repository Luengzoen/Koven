import type { ChatBlock } from '@renderer/capabilities/task-chat/block-model'
import { BodyBlockView } from '@renderer/capabilities/task-chat/blocks/body-block'
import { McpBlockView } from '@renderer/capabilities/task-chat/blocks/mcp-block'
import { ShellBlockView } from '@renderer/capabilities/task-chat/blocks/shell-block'
import { SkillBlockView } from '@renderer/capabilities/task-chat/blocks/skill-block'
import { ThinkingBlockView } from '@renderer/capabilities/task-chat/blocks/thinking-block'
import { ToolCallBlockView } from '@renderer/capabilities/task-chat/blocks/tool-call-block'
import type { ComponentType } from 'react'

type BlockViewProps = {
  block: ChatBlock
}

type BlockViewComponent = ComponentType<BlockViewProps>

/** 新积木：加类型 + 组件文件 + 本表一行 */
export const blockViews = {
  thinking: ThinkingBlockView as BlockViewComponent,
  body: BodyBlockView as BlockViewComponent,
  tool_call: ToolCallBlockView as BlockViewComponent,
  shell: ShellBlockView as BlockViewComponent,
  skill: SkillBlockView as BlockViewComponent,
  mcp: McpBlockView as BlockViewComponent
} as const satisfies Record<ChatBlock['kind'], BlockViewComponent>
