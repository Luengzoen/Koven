import type { Result } from '../kernel/result'

export const shellIpc = {
  isMaximized: 'shell:is-maximized',
  maximizedChanged: 'shell:maximized-changed',
  getSnapshot: 'shell:get-snapshot',
  patchUi: 'shell:patch-ui'
} as const

export type ShellWindowBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type ShellWindowState = {
  bounds: ShellWindowBounds
  maximized: boolean
}

export type ShellNavigationState = {
  activePageId: string
  /** 仅侧栏常规入口写入；非侧栏进入时为 null */
  sidebarSelectedId: string | null
}

export type ShellSidebarState = {
  open: boolean
  width: number
}

export type ShellSnapshot = {
  version: 1
  window: ShellWindowState
  navigation: ShellNavigationState
  sidebar: ShellSidebarState
}

export type ShellUiPatch = {
  navigation?: ShellNavigationState
  sidebar?: ShellSidebarState
}

export type ShellAPI = {
  shell: {
    isMaximized: () => Promise<Result<boolean>>
    onMaximizedChange: (callback: (maximized: boolean) => void) => () => void
    getSnapshot: () => Promise<Result<ShellSnapshot>>
    patchUi: (patch: ShellUiPatch) => Promise<Result<ShellSnapshot>>
  }
}
