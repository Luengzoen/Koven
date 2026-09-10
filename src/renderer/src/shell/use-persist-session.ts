import { useEffect, useRef } from 'react'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { useShellLayoutStore } from '@renderer/shell/shell-layout-store'
import {
  persistPreferencesSoon,
  persistShellUiSoon
} from '@renderer/shell/session-persistence'

/** 订阅壳 UI / 偏好变化并防抖写回主进程 JSON */
export function usePersistSession() {
  const activeId = useNavigationStore((state) => state.activeId)
  const sidebarSelectedId = useNavigationStore((state) => state.sidebarSelectedId)
  const sidebarOpen = useShellLayoutStore((state) => state.sidebarOpen)
  const sidebarWidth = useShellLayoutStore((state) => state.sidebarWidth)
  const theme = usePreferencesStore((state) => state.theme)
  const locale = usePreferencesStore((state) => state.locale)
  const general = usePreferencesStore((state) => state.general)

  const shellReady = useRef(false)
  const preferencesReady = useRef(false)

  useEffect(() => {
    if (!shellReady.current) {
      shellReady.current = true
      return
    }
    const timer = setTimeout(() => {
      persistShellUiSoon()
    }, 200)
    return () => clearTimeout(timer)
  }, [activeId, sidebarSelectedId, sidebarOpen, sidebarWidth])

  useEffect(() => {
    if (!preferencesReady.current) {
      preferencesReady.current = true
      return
    }
    const timer = setTimeout(() => {
      persistPreferencesSoon()
    }, 200)
    return () => clearTimeout(timer)
  }, [theme, locale, general])
}
