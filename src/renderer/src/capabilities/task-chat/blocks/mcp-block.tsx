import type { McpBlock } from '@renderer/capabilities/task-chat/block-model'
import { CollapsibleChrome } from '@renderer/capabilities/task-chat/blocks/collapsible-chrome'
import { TextShimmer } from '@renderer/capabilities/task-chat/blocks/text-shimmer'
import { useT } from '@renderer/shell/use-t'
import { WrenchIcon } from 'lucide-react'

type McpBlockViewProps = {
  block: McpBlock
}

export function McpBlockView({ block }: McpBlockViewProps) {
  const t = useT()
  const statusText =
    block.status === 'running' ? t('chat.block.mcpRunning') : t('chat.block.mcpDone')
  const title = `${block.mcpName} · ${block.functionName}`

  return (
    <CollapsibleChrome
      icon={WrenchIcon}
      title={title}
      statusText={statusText}
      status={block.status}
    >
      <TextShimmer
        active={block.status === 'running'}
        className="select-text block whitespace-pre-wrap leading-6 text-muted-foreground"
      >
        {block.summary}
      </TextShimmer>
    </CollapsibleChrome>
  )
}
