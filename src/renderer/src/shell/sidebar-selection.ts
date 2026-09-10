import { overviewPages, getPage, homePage } from '@renderer/routes'
import { mockProjects } from '@renderer/shell/sidebar/mock-projects'

/** 侧栏常规可见入口（Overview + Projects 树中的任务页） */
export function listSidebarSelectableIds(): ReadonlySet<string> {
  const ids = new Set<string>(overviewPages.map((page) => page.id))
  for (const project of mockProjects) {
    for (const task of project.tasks) {
      ids.add(task.pageId)
    }
  }
  return ids
}

export function resolveNavigationHydration(
  activePageId: string,
  sidebarSelectedId: string | null
): { activeId: string; sidebarSelectedId: string | null } {
  const selectable = listSidebarSelectableIds()
  const activeId = getPage(activePageId)?.id ?? homePage.id
  const selected =
    sidebarSelectedId && selectable.has(sidebarSelectedId) ? sidebarSelectedId : null
  return { activeId, sidebarSelectedId: selected }
}
