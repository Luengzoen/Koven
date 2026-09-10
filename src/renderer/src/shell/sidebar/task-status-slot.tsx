import type { TaskStatus } from '@renderer/shell/sidebar/mock-projects'
import { cn } from '@renderer/lib/cn'
import { LoaderCircleIcon } from 'lucide-react'

export function TaskStatusSlot({ status }: { status: TaskStatus }) {
  if (status === 'loading') {
    return (
      <LoaderCircleIcon
        className="size-3.5 shrink-0 animate-spin text-muted-foreground"
        aria-label="进行中"
      />
    )
  }

  if (status === 'done') {
    return (
      <span
        className={cn(
          'shrink-0 rounded px-1 py-0.5 text-xs leading-none font-medium',
          'bg-success/15 text-success'
        )}
      >
        完成
      </span>
    )
  }

  if (status === 'error') {
    return (
      <span
        className={cn(
          'shrink-0 rounded px-1 py-0.5 text-xs leading-none font-medium',
          'bg-danger/15 text-danger'
        )}
      >
        失败
      </span>
    )
  }

  return null
}
