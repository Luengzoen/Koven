import type { ChatBlock } from '@renderer/capabilities/task-chat/block-model'
import { blockViews } from '@renderer/capabilities/task-chat/blocks/block-views'

type BlockListProps = {
  blocks: ChatBlock[]
}

export function BlockList({ blocks }: BlockListProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {blocks.map((block) => {
        const View = blockViews[block.kind]
        return <View key={block.id} block={block} />
      })}
    </div>
  )
}
