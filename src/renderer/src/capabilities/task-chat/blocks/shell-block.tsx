import type { ShellBlock } from '@renderer/capabilities/task-chat/block-model'
import { CollapsibleChrome } from '@renderer/capabilities/task-chat/blocks/collapsible-chrome'
import { useT } from '@renderer/shell/use-t'
import { TerminalIcon } from 'lucide-react'

type ShellBlockViewProps = {
  block: ShellBlock
}

export function ShellBlockView({ block }: ShellBlockViewProps) {
  const t = useT()
  const statusText =
    block.status === 'running' ? t('chat.block.shellRunning') : t('chat.block.shellDone')

  return (
    <CollapsibleChrome
      icon={TerminalIcon}
      title={block.shellName}
      statusText={statusText}
      status={block.status}
    >
      <pre className="select-text overflow-x-auto font-mono text-xs leading-5 text-foreground whitespace-pre-wrap">
        {block.command}
      </pre>
    </CollapsibleChrome>
  )
}
