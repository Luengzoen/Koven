import type { TaskStatus } from '@renderer/shell/sidebar/mock-projects'
import { cn } from '@renderer/lib/cn'
import { LoaderCircleIcon } from 'lucide-react'

export function TaskStatusSlot({ status }: { status: TaskStatus }) {
  if (status === 'loading') {
    return (
      <LoaderCircleIcon
        className="size-3.5 shrink-0 animate-spin text-zinc-400"
        aria-label="进行中"
      />
    )
  }

  if (status === 'done') {
    return (
      <span
        className={cn(
          'shrink-0 rounded px-1 py-0.5 text-[10px] leading-none font-medium',
          'bg-emerald-500/15 text-emerald-400'
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
          'shrink-0 rounded px-1 py-0.5 text-[10px] leading-none font-medium',
          'bg-red-500/15 text-red-400'
        )}
      >
        失败
      </span>
    )
  }

  return null
}
