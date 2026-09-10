import { create } from 'zustand'

export const SIDEBAR_WIDTH_MIN = 250
export const SIDEBAR_WIDTH_MAX = 600
export const SIDEBAR_WIDTH_DEFAULT = 250

type ShellLayoutState = {
  sidebarOpen: boolean
  /** 展开时使用的宽度；收起/展开不改写该值 */
  sidebarWidth: number
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarWidth: (width: number) => void
}

function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, Math.round(width)))
}

export const useShellLayoutStore = create<ShellLayoutState>((set) => ({
  sidebarOpen: true,
  sidebarWidth: SIDEBAR_WIDTH_DEFAULT,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarWidth: (width) => set({ sidebarWidth: clampSidebarWidth(width) })
}))
