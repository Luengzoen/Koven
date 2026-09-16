import type { ThinkingBlock } from '@renderer/capabilities/task-chat/block-model'
import { CollapsibleChrome } from '@renderer/capabilities/task-chat/blocks/collapsible-chrome'
import { useT } from '@renderer/shell/use-t'
import { BrainIcon } from 'lucide-react'

type ThinkingBlockViewProps = {
  block: ThinkingBlock
}

export function ThinkingBlockView({ block }: ThinkingBlockViewProps) {
  const t = useT()
  const statusText =
    block.status === 'running' ? t('chat.block.thinkingRunning') : t('chat.block.thinkingDone')

  return (
    <CollapsibleChrome
      icon={BrainIcon}
      title={t('chat.block.thinking')}
      statusText={statusText}
      status={block.status}
    >
      <p className="select-text whitespace-pre-wrap leading-6 text-muted-foreground">
        {block.content}
      </p>
    </CollapsibleChrome>
  )
}
