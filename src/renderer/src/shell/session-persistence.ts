import {
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN
} from '@renderer/shell/shell-layout-store'
import { applyTheme } from '@renderer/shell/apply-theme'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { useShellLayoutStore } from '@renderer/shell/shell-layout-store'
import { resolveNavigationHydration } from '@renderer/shell/sidebar-selection'

function clampWidth(width: number): number {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, Math.round(width)))
}

export async function hydrateSession(): Promise<void> {
  if (!window.koven) return

  const [shellResult, preferencesResult] = await Promise.all([
    window.koven.shell.getSnapshot(),
    window.koven.preferences.get()
  ])

  if (shellResult.ok) {
    const { navigation, sidebar } = shellResult.value
    const resolved = resolveNavigationHydration(
      navigation.activePageId,
      navigation.sidebarSelectedId
    )
    useNavigationStore.getState().hydrate(resolved.activeId, resolved.sidebarSelectedId)
    useShellLayoutStore.setState({
      sidebarOpen: sidebar.open,
      sidebarWidth: clampWidth(sidebar.width) || SIDEBAR_WIDTH_DEFAULT
    })
  }

  if (preferencesResult.ok) {
    usePreferencesStore.getState().hydrate(preferencesResult.value)
    applyTheme({ preference: preferencesResult.value.theme })
  }
}

export function persistShellUiSoon(): void {
  if (!window.koven) return
  const navigation = useNavigationStore.getState()
  const layout = useShellLayoutStore.getState()
  void window.koven.shell.patchUi({
    navigation: {
      activePageId: navigation.activeId,
      sidebarSelectedId: navigation.sidebarSelectedId
    },
    sidebar: {
      open: layout.sidebarOpen,
      width: layout.sidebarWidth
    }
  })
}

export function persistPreferencesSoon(): void {
  if (!window.koven) return
  const { theme, locale, general } = usePreferencesStore.getState()
  void window.koven.preferences.set({ theme, locale, general })
}
