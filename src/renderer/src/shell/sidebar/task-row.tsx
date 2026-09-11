import type { SidebarTask } from '@renderer/shell/sidebar/mock-projects'
import { TaskStatusSlot } from '@renderer/shell/sidebar/task-status-slot'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { useT } from '@renderer/shell/use-t'
import { cn } from '@renderer/lib/cn'
import { EllipsisIcon, MessageCircleIcon } from 'lucide-react'

export function TaskRow({ task }: { task: SidebarTask }) {
  const sidebarSelectedId = useNavigationStore((state) => state.sidebarSelectedId)
  const openFromSidebar = useNavigationStore((state) => state.openFromSidebar)
  const active = sidebarSelectedId === task.pageId
  const t = useT()

  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-md py-1 pr-1 pl-2 text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <button
        type="button"
        onClick={() => openFromSidebar(task.pageId)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none"
      >
        <MessageCircleIcon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{task.title}</span>
        <TaskStatusSlot status={task.status} />
      </button>
      <button
        type="button"
        aria-label={t('nav.taskMenu')}
        className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent [&_svg]:size-3.5"
        onClick={(event) => event.stopPropagation()}
      >
        <EllipsisIcon />
      </button>
    </div>
  )
}
