import type { BodyBlock } from '@renderer/capabilities/task-chat/block-model'
import { MarkdownBody } from '@renderer/capabilities/task-chat/blocks/markdown-body'

type BodyBlockViewProps = {
  block: BodyBlock
}

export function BodyBlockView({ block }: BodyBlockViewProps) {
  if (!block.content) return null
  return <MarkdownBody content={block.content} />
}
