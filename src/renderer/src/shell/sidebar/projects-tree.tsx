import { useProjectsStore } from '@renderer/capabilities/projects/projects-store'
import { ProjectRow } from '@renderer/shell/sidebar/project-row'
import { SidebarSkeleton } from '@renderer/shell/sidebar/sidebar-skeleton'
import { dropTaskPageCache } from '@renderer/routes'
import { HOME_PAGE_ID } from '@renderer/shell/page-ids'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { useT } from '@renderer/shell/use-t'
import { toTaskPageId } from '@shared/capabilities/projects'
import { EllipsisIcon } from 'lucide-react'
import { useMemo } from 'react'

export function ProjectsTree() {
  const t = useT()
  const projects = useProjectsStore((state) => state.projects)
  const tasksByProject = useProjectsStore((state) => state.tasksByProject)
  const expandedIds = useProjectsStore((state) => state.expandedIds)
  const toggleExpanded = useProjectsStore((state) => state.toggleExpanded)
  const loadMoreTasks = useProjectsStore((state) => state.loadMoreTasks)
  const searchQuery = useProjectsStore((state) => state.searchQuery)
  const searchHits = useProjectsStore((state) => state.searchHits)
  const searchHasMore = useProjectsStore((state) => state.searchHasMore)
  const searchLoading = useProjectsStore((state) => state.searchLoading)
  const loadMoreSearch = useProjectsStore((state) => state.loadMoreSearch)
  const upsertTask = useProjectsStore((state) => state.upsertTask)
  const removeTask = useProjectsStore((state) => state.removeTask)
  const removeProject = useProjectsStore((state) => state.removeProject)
  const activeId = useNavigationStore((state) => state.activeId)
  const openFromSidebar = useNavigationStore((state) => state.openFromSidebar)

  const searching = searchQuery.trim().length > 0

  const searchGrouped = useMemo(() => {
    if (!searching) return []
    const map = new Map<
      string,
      {
        project: (typeof searchHits)[number] extends { project: infer P } ? P : never
        tasks: { id: string; title: string; status: 'idle' | 'loading' | 'finished' | 'error' }[]
        projectHit: boolean
      }
    >()
    for (const hit of searchHits) {
      const existing = map.get(hit.project.id)
      if (!existing) {
        map.set(hit.project.id, {
          project: hit.project,
          tasks: hit.kind === 'task' ? [hit.task] : [],
          projectHit: hit.kind === 'project'
        })
      } else if (hit.kind === 'task') {
        if (!existing.tasks.some((task) => task.id === hit.task.id)) {
          existing.tasks.push(hit.task)
        }
      } else {
        existing.projectHit = true
      }
    }
    return Array.from(map.values())
  }, [searchHits, searching])

  async function handleRename(taskId: string, title: string) {
    if (!window.koven?.projects) return
    const result = await window.koven.projects.renameTask({ taskId, title })
    if (result.ok) upsertTask(result.value)
  }

  async function handleArchive(taskId: string) {
    if (!window.koven?.projects) return
    const result = await window.koven.projects.archiveTask(taskId)
    if (!result.ok) return
    removeTask(taskId)
    dropTaskPageCache(taskId)
    if (result.value.removedProjectId) {
      removeProject(result.value.removedProjectId)
    }
    if (activeId === toTaskPageId(taskId)) {
      openFromSidebar(HOME_PAGE_ID)
    }
  }

  async function handleDelete(taskId: string) {
    if (!window.koven?.projects) return
    const result = await window.koven.projects.deleteTask(taskId)
    if (!result.ok) return
    removeTask(taskId)
    dropTaskPageCache(taskId)
    if (result.value.removedProjectId) {
      removeProject(result.value.removedProjectId)
    }
    if (activeId === toTaskPageId(taskId)) {
      openFromSidebar(HOME_PAGE_ID)
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-1 px-2 pb-2">
      <h2 className="shrink-0 px-2 text-xs font-medium tracking-wide text-muted-foreground">
        {t('nav.sectionProjects')}
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 pr-0.5">
          {searching && searchLoading && searchHits.length === 0 ? (
            <SidebarSkeleton rows={6} />
          ) : null}

          {searching && !searchLoading && searchHits.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">{t('nav.searchEmpty')}</p>
          ) : null}

          {searching
            ? searchGrouped.map((group) => (
                <ProjectRow
                  key={group.project.id}
                  project={group.project}
                  tasks={group.tasks.map((task) => ({
                    ...task,
                    projectId: group.project.id,
                    archived: false,
                    lastChatAt: 0,
                    createdAt: 0,
                    updatedAt: 0
                  }))}
                  hasMore={false}
                  loadingMore={false}
                  expanded
                  highlightQuery={searchQuery}
                  onToggle={() => undefined}
                  onLoadMore={() => undefined}
                  onRenameTask={handleRename}
                  onArchiveTask={handleArchive}
                  onDeleteTask={handleDelete}
                />
              ))
            : projects.map((project) => {
                const slice = tasksByProject[project.id]
                return (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    tasks={slice?.tasks ?? []}
                    hasMore={slice?.hasMore ?? false}
                    loadingMore={slice?.loading ?? false}
                    expanded={expandedIds.has(project.id)}
                    onToggle={() => toggleExpanded(project.id)}
                    onLoadMore={() => void loadMoreTasks(project.id)}
                    onRenameTask={handleRename}
                    onArchiveTask={handleArchive}
                    onDeleteTask={handleDelete}
                  />
                )
              })}

          {searching && searchHasMore ? (
            <button
              type="button"
              onClick={() => void loadMoreSearch()}
              disabled={searchLoading}
              className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-1 pl-2 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground disabled:opacity-60"
            >
              <EllipsisIcon className="size-4 shrink-0" />
              <span>{t('nav.loadMoreTasks')}</span>
            </button>
          ) : null}

          {searching && searchLoading && searchHits.length > 0 ? (
            <SidebarSkeleton rows={2} />
          ) : null}
        </div>
      </div>
    </section>
  )
}
