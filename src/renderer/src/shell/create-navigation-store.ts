import { create } from 'zustand'

type NavigationState = {
  activeId: string
  sidebarSelectedId: string | null
  visitedIds: readonly string[]
  openFromSidebar: (id: string) => void
  open: (id: string) => void
  hydrate: (activeId: string, sidebarSelectedId: string | null) => void
}

export function createNavigationStore(initialId: string) {
  return create<NavigationState>((set, get) => ({
    activeId: initialId,
    sidebarSelectedId: initialId,
    visitedIds: [initialId],
    openFromSidebar: (id) => {
      const { visitedIds } = get()
      set({
        activeId: id,
        sidebarSelectedId: id,
        visitedIds: visitedIds.includes(id) ? visitedIds : [...visitedIds, id]
      })
    },
    open: (id) => {
      const { visitedIds } = get()
      set({
        activeId: id,
        sidebarSelectedId: null,
        visitedIds: visitedIds.includes(id) ? visitedIds : [...visitedIds, id]
      })
    },
    hydrate: (activeId, sidebarSelectedId) => {
      set({
        activeId,
        sidebarSelectedId,
        visitedIds: [activeId]
      })
    }
  }))
}
