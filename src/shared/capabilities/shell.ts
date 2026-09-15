import type { Result } from '../kernel/result'

export const shellIpc = {
  isMaximized: 'shell:is-maximized',
  maximizedChanged: 'shell:maximized-changed',
  getSnapshot: 'shell:get-snapshot',
  patchUi: 'shell:patch-ui',
  uiReady: 'shell:ui-ready'
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

export const preferencesSectionIds = ['general', 'system'] as const
export type PreferencesSectionId = (typeof preferencesSectionIds)[number]

export function normalizePreferencesSectionId(raw: unknown): PreferencesSectionId {
  if (typeof raw === 'string' && (preferencesSectionIds as readonly string[]).includes(raw)) {
    return raw as PreferencesSectionId
  }
  return 'general'
}

export type ShellNavigationState = {
  activePageId: string
  /** 仅侧栏常规入口写入；非侧栏进入时为 null */
  sidebarSelectedId: string | null
  /** 首选项内部分类（General / System 等） */
  preferencesSectionId: PreferencesSectionId
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
    /** 主窗首帧已绘；启动 Splash 交接用（只发一次） */
    notifyUiReady: () => void
  }
}
