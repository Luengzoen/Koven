import { create } from 'zustand'
import { getPage, homePage } from '@renderer/routes'
import { listSidebarSelectableIds } from '@renderer/shell/sidebar-selection'

type NavigationState = {
  activeId: string
  sidebarSelectedId: string | null
  visitedIds: readonly string[]
  /** 可返回的历史栈（不含当前页）；不落盘 */
  backStack: readonly string[]
  openFromSidebar: (id: string) => void
  open: (id: string) => void
  back: () => void
  hydrate: (activeId: string, sidebarSelectedId: string | null) => void
}

function sidebarSelectionFor(id: string): string | null {
  return listSidebarSelectableIds().has(id) ? id : null
}

function pushVisit(visitedIds: readonly string[], id: string): readonly string[] {
  return visitedIds.includes(id) ? visitedIds : [...visitedIds, id]
}

export function createNavigationStore(initialId: string) {
  return create<NavigationState>((set, get) => ({
    activeId: initialId,
    sidebarSelectedId: initialId,
    visitedIds: [initialId],
    backStack: [],
    openFromSidebar: (id) => {
      const { activeId, visitedIds, backStack } = get()
      if (id === activeId) {
        set({ sidebarSelectedId: id })
        return
      }
      set({
        activeId: id,
        sidebarSelectedId: id,
        visitedIds: pushVisit(visitedIds, id),
        backStack: [...backStack, activeId]
      })
    },
    open: (id) => {
      const { activeId, visitedIds, backStack } = get()
      if (id === activeId) {
        set({ sidebarSelectedId: null })
        return
      }
      set({
        activeId: id,
        sidebarSelectedId: null,
        visitedIds: pushVisit(visitedIds, id),
        backStack: [...backStack, activeId]
      })
    },
    back: () => {
      const { backStack, visitedIds } = get()
      const previousId = backStack[backStack.length - 1]
      if (!previousId || !getPage(previousId)) {
        set({
          activeId: homePage.id,
          sidebarSelectedId: homePage.id,
          visitedIds: pushVisit(visitedIds, homePage.id),
          backStack: []
        })
        return
      }
      set({
        activeId: previousId,
        sidebarSelectedId: sidebarSelectionFor(previousId),
        visitedIds: pushVisit(visitedIds, previousId),
        backStack: backStack.slice(0, -1)
      })
    },
    hydrate: (activeId, sidebarSelectedId) => {
      set({
        activeId,
        sidebarSelectedId,
        visitedIds: [activeId],
        backStack: []
      })
    }
  }))
}
