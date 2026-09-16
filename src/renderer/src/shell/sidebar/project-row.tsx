import { HighlightText } from '@renderer/shell/sidebar/highlight-text'
import { TaskRow } from '@renderer/shell/sidebar/task-row'
import { useDraftStore } from '@renderer/shell/draft-store'
import { DRAFT_PAGE_ID } from '@renderer/shell/draft-page'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { useT } from '@renderer/shell/use-t'
import { cn } from '@renderer/lib/cn'
import { ChevronRightIcon, EllipsisIcon, FolderIcon, PlusIcon } from 'lucide-react'
import type { ProjectRecord, TaskRecord } from '@shared/capabilities/projects'

type ProjectRowProps = {
  project: ProjectRecord
  tasks: readonly TaskRecord[]
  hasMore: boolean
  loadingMore: boolean
  expanded: boolean
  highlightQuery?: string
  onToggle: () => void
  onLoadMore: () => void
  onRenameTask: (taskId: string, title: string) => void
  onArchiveTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

export function ProjectRow({
  project,
  tasks,
  hasMore,
  loadingMore,
  expanded,
  highlightQuery = '',
  onToggle,
  onLoadMore,
  onRenameTask,
  onArchiveTask,
  onDeleteTask
}: ProjectRowProps) {
  const t = useT()
  const openFromSidebar = useNavigationStore((state) => state.openFromSidebar)

  return (
    <div className="flex flex-col gap-0.5">
      <div className="group flex items-center gap-1 rounded-md py-1 pr-1 pl-2 text-sm text-foreground/80 transition-colors hover:bg-muted">
        <button
          type="button"
          title={project.projectPath}
          onClick={onToggle}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none"
          aria-expanded={expanded}
        >
          <ChevronRightIcon
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-90'
            )}
          />
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-medium">
            <HighlightText text={project.name} query={highlightQuery} />
          </span>
        </button>
        <button
          type="button"
          aria-label={t('nav.newTask')}
          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent [&_svg]:size-3.5"
          onClick={(event) => {
            event.stopPropagation()
            useDraftStore.getState().openInProject(project.id)
            openFromSidebar(DRAFT_PAGE_ID)
          }}
        >
          <PlusIcon />
        </button>
      </div>
      {expanded ? (
        <div className="flex flex-col gap-0.5 pl-4">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              highlightQuery={highlightQuery}
              onRenamed={(title) => onRenameTask(task.id, title)}
              onArchived={() => onArchiveTask(task.id)}
              onDeleted={() => onDeleteTask(task.id)}
            />
          ))}
          {hasMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-1 pl-2 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground disabled:opacity-60"
            >
              <EllipsisIcon className="size-4 shrink-0" />
              <span>{t('nav.loadMoreTasks')}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
