import type {
  ChatBlock,
  McpBlock,
  ShellBlock,
  SkillBlock,
  ThinkingBlock,
  BodyBlock,
  ToolCallBlock,
  ToolCallItem
} from '@renderer/capabilities/task-chat/block-model'
import {
  buildDemoEvents,
  type DemoEvent,
  type DemoPath
} from '@renderer/capabilities/task-chat/mock/demo-script'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function mapBlocks(
  blocks: ChatBlock[],
  path: DemoPath,
  mapper: (blocks: ChatBlock[]) => ChatBlock[]
): ChatBlock[] {
  if (path.type === 'root') return mapper(blocks)

  return blocks.map((block) => {
    if (block.kind !== 'skill' || block.id !== path.skillBlockId) return block
    return { ...block, blocks: mapper(block.blocks) }
  })
}

function findBlock(blocks: ChatBlock[], path: DemoPath, blockId: string): ChatBlock | undefined {
  const list =
    path.type === 'root'
      ? blocks
      : (blocks.find(
          (b): b is SkillBlock => b.kind === 'skill' && b.id === path.skillBlockId
        )?.blocks ?? [])
  return list.find((b) => b.id === blockId)
}

function applyTextField(
  block: ChatBlock,
  field: 'content' | 'summary' | 'command',
  text: string
): ChatBlock {
  if (field === 'content' && (block.kind === 'thinking' || block.kind === 'body')) {
    return { ...block, content: text } satisfies ThinkingBlock | BodyBlock
  }
  if (field === 'summary' && block.kind === 'mcp') {
    return { ...block, summary: text } satisfies McpBlock
  }
  if (field === 'command' && block.kind === 'shell') {
    return { ...block, command: text } satisfies ShellBlock
  }
  return block
}

function applyPatch(block: ChatBlock, patch: Partial<ChatBlock>): ChatBlock {
  return { ...block, ...patch } as ChatBlock
}

function applyItemPatch(
  block: ChatBlock,
  itemId: string,
  patch: Partial<ToolCallItem>
): ChatBlock {
  if (block.kind !== 'tool_call') return block
  const next: ToolCallBlock = {
    ...block,
    items: block.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
  }
  return next
}

export async function playDemoStream(options: {
  onBlocks: (blocks: ChatBlock[]) => void
  signal?: { cancelled: boolean }
}): Promise<void> {
  let blocks: ChatBlock[] = []
  const events: DemoEvent[] = buildDemoEvents()

  const publish = (): void => {
    options.onBlocks(blocks.map((b) => structuredClone(b)))
  }

  for (const event of events) {
    if (options.signal?.cancelled) return

    if (event.op === 'append') {
      if (event.delayMs) await sleep(event.delayMs)
      if (options.signal?.cancelled) return
      blocks = mapBlocks(blocks, event.path, (list) => [...list, event.block])
      publish()
      continue
    }

    if (event.op === 'patch') {
      if (event.delayMs) await sleep(event.delayMs)
      if (options.signal?.cancelled) return
      blocks = mapBlocks(blocks, event.path, (list) =>
        list.map((block) => {
          if (block.id !== event.blockId) return block
          if (typeof event.patch === 'function') return event.patch(block)
          return applyPatch(block, event.patch)
        })
      )
      publish()
      continue
    }

    if (event.op === 'patchItem') {
      if (event.delayMs) await sleep(event.delayMs)
      if (options.signal?.cancelled) return
      blocks = mapBlocks(blocks, event.path, (list) =>
        list.map((block) =>
          block.id === event.blockId ? applyItemPatch(block, event.itemId, event.patch) : block
        )
      )
      publish()
      continue
    }

    if (event.op === 'streamText') {
      const chunkSize = event.chunkSize ?? 2
      const charDelayMs = event.charDelayMs ?? 12
      for (let i = 0; i < event.text.length; i += chunkSize) {
        if (options.signal?.cancelled) return
        const written = event.text.slice(0, i + chunkSize)
        const current = findBlock(blocks, event.path, event.blockId)
        if (!current) break
        const updated = applyTextField(current, event.field, written)
        blocks = mapBlocks(blocks, event.path, (list) =>
          list.map((block) => (block.id === event.blockId ? updated : block))
        )
        publish()
        await sleep(charDelayMs)
      }
    }
  }
}
