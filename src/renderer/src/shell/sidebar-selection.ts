import { overviewPages, getPage } from '@renderer/routes'
import { useProjectsStore } from '@renderer/capabilities/projects/projects-store'
import { isTaskPageId } from '@renderer/shell/draft-page'
import { HOME_PAGE_ID } from '@renderer/shell/page-ids'
import { parseTaskPageId } from '@shared/capabilities/projects'

/** 侧栏常规可见入口（Overview + 已加载任务页） */
export function listSidebarSelectableIds(): ReadonlySet<string> {
  const ids = new Set<string>(overviewPages.map((page) => page.id))
  for (const id of useProjectsStore.getState().listSelectableTaskPageIds()) {
    ids.add(id)
  }
  return ids
}

export function resolveNavigationHydration(
  activePageId: string,
  sidebarSelectedId: string | null
): { activeId: string; sidebarSelectedId: string | null } {
  const selectable = listSidebarSelectableIds()

  let activeId = activePageId
  if (isTaskPageId(activePageId)) {
    const taskId = parseTaskPageId(activePageId)
    const task = taskId ? useProjectsStore.getState().getTaskById(taskId) : undefined
    if (!task || task.archived) {
      activeId = HOME_PAGE_ID
    }
  } else if (!getPage(activePageId)) {
    activeId = HOME_PAGE_ID
  }

  const selected =
    sidebarSelectedId && selectable.has(sidebarSelectedId)
      ? sidebarSelectedId
      : activeId === HOME_PAGE_ID || selectable.has(activeId)
        ? activeId
        : null

  if (isTaskPageId(activeId) && selected == null) {
    return { activeId, sidebarSelectedId: activeId }
  }

  return {
    activeId,
    sidebarSelectedId: selected && selectable.has(selected) ? selected : selected
  }
}
