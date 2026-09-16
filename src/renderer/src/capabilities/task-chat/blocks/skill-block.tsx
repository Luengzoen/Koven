import type { SkillBlock } from '@renderer/capabilities/task-chat/block-model'
import { BlockList } from '@renderer/capabilities/task-chat/blocks/block-list'
import { CollapsibleChrome } from '@renderer/capabilities/task-chat/blocks/collapsible-chrome'
import { useT } from '@renderer/shell/use-t'
import { BookOpenIcon } from 'lucide-react'

type SkillBlockViewProps = {
  block: SkillBlock
}

export function SkillBlockView({ block }: SkillBlockViewProps) {
  const t = useT()
  const statusText =
    block.status === 'running' ? t('chat.block.skillRunning') : t('chat.block.skillDone')

  return (
    <CollapsibleChrome
      icon={BookOpenIcon}
      title={block.skillName}
      statusText={statusText}
      status={block.status}
    >
      {/* 子 loop 无额外缩进，归属由本积木标题栏表达 */}
      <BlockList blocks={block.blocks} />
    </CollapsibleChrome>
  )
}
