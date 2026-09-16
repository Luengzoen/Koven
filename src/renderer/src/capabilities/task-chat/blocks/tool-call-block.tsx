import type { ToolCallBlock } from '@renderer/capabilities/task-chat/block-model'
import { CollapsibleChrome } from '@renderer/capabilities/task-chat/blocks/collapsible-chrome'
import { TextShimmer } from '@renderer/capabilities/task-chat/blocks/text-shimmer'
import {
  toolCallHeaderIcon,
  toolItemIcons
} from '@renderer/capabilities/task-chat/blocks/tool-item-icons'
import { useT } from '@renderer/shell/use-t'

type ToolCallBlockViewProps = {
  block: ToolCallBlock
}

export function ToolCallBlockView({ block }: ToolCallBlockViewProps) {
  const t = useT()
  const statusText =
    block.status === 'running' ? t('chat.block.toolRunning') : t('chat.block.toolDone')
  const HeaderIcon = toolCallHeaderIcon(block.items.map((item) => item.itemKind))

  return (
    <CollapsibleChrome
      icon={HeaderIcon}
      title={block.toolName}
      statusText={statusText}
      status={block.status}
    >
      <ul className="flex flex-col gap-1.5">
        {block.items.map((item) => {
          const ItemIcon = toolItemIcons[item.itemKind]
          return (
            <li key={item.id} className="flex min-w-0 items-center gap-2 text-sm">
              <ItemIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <TextShimmer
                active={item.status === 'running'}
                className="min-w-0 truncate text-foreground"
              >
                {item.summary}
              </TextShimmer>
            </li>
          )
        })}
      </ul>
    </CollapsibleChrome>
  )
}
