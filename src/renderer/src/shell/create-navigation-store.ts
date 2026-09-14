import { create } from 'zustand'
import { getPage } from '@renderer/routes'
import { isDraftPageId } from '@renderer/shell/draft-page'
import { useDraftStore } from '@renderer/shell/draft-store'
import { HOME_PAGE_ID } from '@renderer/shell/page-ids'
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
  if (isDraftPageId(id)) return visitedIds.filter((entry) => !isDraftPageId(entry))
  if (visitedIds.includes(id)) return visitedIds.filter((entry) => !isDraftPageId(entry))
  return [...visitedIds.filter((entry) => !isDraftPageId(entry)), id]
}

function clearDraftIfLeaving(fromId: string, toId: string): void {
  if (isDraftPageId(fromId) && !isDraftPageId(toId)) {
    useDraftStore.getState().clear()
  }
}

export function createNavigationStore(initialId: string) {
  return create<NavigationState>((set, get) => ({
    activeId: initialId,
    sidebarSelectedId: initialId,
    visitedIds: isDraftPageId(initialId) ? [] : [initialId],
    backStack: [],
    openFromSidebar: (id) => {
      const { activeId, visitedIds, backStack } = get()
      if (id === activeId) {
        set({ sidebarSelectedId: id })
        return
      }
      clearDraftIfLeaving(activeId, id)
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
      clearDraftIfLeaving(activeId, id)
      set({
        activeId: id,
        sidebarSelectedId: null,
        visitedIds: pushVisit(visitedIds, id),
        backStack: [...backStack, activeId]
      })
    },
    back: () => {
      const { activeId, backStack, visitedIds } = get()
      const previousId = backStack[backStack.length - 1]
      if (!previousId || !getPage(previousId)) {
        clearDraftIfLeaving(activeId, HOME_PAGE_ID)
        set({
          activeId: HOME_PAGE_ID,
          sidebarSelectedId: HOME_PAGE_ID,
          visitedIds: pushVisit(visitedIds, HOME_PAGE_ID),
          backStack: []
        })
        return
      }
      clearDraftIfLeaving(activeId, previousId)
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
        visitedIds: isDraftPageId(activeId) ? [] : [activeId],
        backStack: []
      })
    }
  }))
}
