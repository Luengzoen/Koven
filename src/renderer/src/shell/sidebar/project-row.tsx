import type { SidebarProject } from '@renderer/shell/sidebar/mock-projects'
import { TaskRow } from '@renderer/shell/sidebar/task-row'
import { useT } from '@renderer/shell/use-t'
import { cn } from '@renderer/lib/cn'
import { ChevronRightIcon, FolderIcon, PlusIcon } from 'lucide-react'

type ProjectRowProps = {
  project: SidebarProject
  expanded: boolean
  onToggle: () => void
}

export function ProjectRow({ project, expanded, onToggle }: ProjectRowProps) {
  const t = useT()

  return (
    <div className="flex flex-col gap-0.5">
      <div className="group flex items-center gap-1 rounded-md py-1 pr-1 pl-2 text-sm text-foreground/80 transition-colors hover:bg-muted">
        <button
          type="button"
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
          <span className="min-w-0 flex-1 truncate font-medium">{project.title}</span>
        </button>
        <button
          type="button"
          aria-label={t('nav.newTask')}
          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent [&_svg]:size-3.5"
          onClick={(event) => event.stopPropagation()}
        >
          <PlusIcon />
        </button>
      </div>
      {expanded ? (
        <div className="flex flex-col gap-0.5 pl-4">
          {project.tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
