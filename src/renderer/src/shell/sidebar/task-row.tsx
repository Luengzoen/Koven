import { OverflowMarquee } from '@renderer/shell/sidebar/overflow-marquee'
import type { TaskStatus } from '@shared/capabilities/projects'
import { TaskStatusSlot } from '@renderer/shell/sidebar/task-status-slot'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { useT } from '@renderer/shell/use-t'
import { cn } from '@renderer/lib/cn'
import { EllipsisIcon, MessageCircleIcon } from 'lucide-react'
import { toTaskPageId } from '@shared/capabilities/projects'
import { TaskRowMenu } from '@renderer/shell/sidebar/task-row-menu'
import { useEffect, useRef, useState } from 'react'

export type SidebarTaskView = {
  id: string
  title: string
  status: TaskStatus
}

type TaskRowProps = {
  task: SidebarTaskView
  highlightQuery?: string
  onRenamed?: (title: string) => void
  onArchived?: () => void
  onDeleted?: () => void
}

export function TaskRow({
  task,
  highlightQuery = '',
  onRenamed,
  onArchived,
  onDeleted
}: TaskRowProps) {
  const sidebarSelectedId = useNavigationStore((state) => state.sidebarSelectedId)
  const activeId = useNavigationStore((state) => state.activeId)
  const openFromSidebar = useNavigationStore((state) => state.openFromSidebar)
  const pageId = toTaskPageId(task.id)
  const active = sidebarSelectedId === pageId
  const showStatus = activeId !== pageId
  const t = useT()
  const [renaming, setRenaming] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const ignoreBlurRef = useRef(false)

  useEffect(() => {
    if (!renaming) return
    ignoreBlurRef.current = true
    const focusTimer = window.setTimeout(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.select()
    }, 0)
    // 菜单关完后的焦点归还会晚于 focus，短暂忽略 blur
    const releaseTimer = window.setTimeout(() => {
      ignoreBlurRef.current = false
    }, 220)
    return () => {
      window.clearTimeout(focusTimer)
      window.clearTimeout(releaseTimer)
      ignoreBlurRef.current = false
    }
  }, [renaming])

  const cancelRename = (): void => {
    setRenaming(false)
    setDraftTitle(task.title)
  }

  const commitRename = (): void => {
    const next = draftTitle.trim()
    if (next && next !== task.title) onRenamed?.(next)
    setRenaming(false)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-md py-1 pr-1 pl-2 text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {renaming ? (
        <input
          ref={inputRef}
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onBlur={() => {
            if (ignoreBlurRef.current) return
            cancelRename()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              cancelRename()
              return
            }
            if (event.key === 'Enter') {
              event.preventDefault()
              commitRename()
            }
          }}
          className="min-w-0 flex-1 rounded bg-background px-1 py-0.5 text-sm text-foreground outline-none ring-1 ring-ring"
          aria-label={t('nav.renameTask')}
        />
      ) : (
        <button
          type="button"
          title={task.title}
          onClick={() => openFromSidebar(pageId)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none"
        >
          <MessageCircleIcon className="size-4 shrink-0" />
          <OverflowMarquee
            text={task.title}
            highlightQuery={highlightQuery}
            className="min-w-0 flex-1"
          />
          {showStatus ? <TaskStatusSlot status={task.status} /> : null}
        </button>
      )}
      <TaskRowMenu
        onRename={() => {
          setDraftTitle(task.title)
          setRenaming(true)
        }}
        onArchive={() => onArchived?.()}
        onDelete={() => onDeleted?.()}
        trigger={
          <button
            type="button"
            aria-label={t('nav.taskMenu')}
            className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent [&_svg]:size-3.5"
            onClick={(event) => event.stopPropagation()}
          >
            <EllipsisIcon />
          </button>
        }
      />
    </div>
  )
}
