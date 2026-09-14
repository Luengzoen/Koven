import { usePreferencesNavStore } from '@renderer/capabilities/preferences/preferences-nav-store'
import { useProjectsStore } from '@renderer/capabilities/projects/projects-store'
import {
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN
} from '@renderer/shell/shell-layout-store'
import { applyTheme } from '@renderer/shell/apply-theme'
import { applyTypography } from '@renderer/shell/apply-typography'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { useShellLayoutStore } from '@renderer/shell/shell-layout-store'
import { resolveNavigationHydration } from '@renderer/shell/sidebar-selection'
import { normalizePreferencesSectionId } from '@shared/capabilities/shell'

function clampWidth(width: number): number {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, Math.round(width)))
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      }
    )
  })
}

/** 壳会话 + 偏好：必须尽快完成，决定首屏 */
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
    usePreferencesNavStore
      .getState()
      .hydrate(normalizePreferencesSectionId(navigation.preferencesSectionId))
    useShellLayoutStore.setState({
      sidebarOpen: sidebar.open,
      sidebarWidth: clampWidth(sidebar.width) || SIDEBAR_WIDTH_DEFAULT
    })
  }

  if (preferencesResult.ok) {
    usePreferencesStore.getState().hydrate(preferencesResult.value)
    applyTheme({ preference: preferencesResult.value.theme })
    applyTypography(preferencesResult.value.general)
  }
}

/** 项目树：不挡首屏；失败/超时只空列表 */
export async function hydrateProjects(): Promise<void> {
  if (!window.koven?.projects) {
    useProjectsStore.setState({ hydrated: true })
    return
  }
  try {
    await withTimeout(useProjectsStore.getState().hydrate(), 8000, 'projects.hydrate')
  } catch {
    useProjectsStore.setState({ hydrated: true })
  }
}

export function persistShellUiSoon(): void {
  if (!window.koven) return
  const navigation = useNavigationStore.getState()
  const layout = useShellLayoutStore.getState()
  const preferencesSectionId = usePreferencesNavStore.getState().sectionId
  void window.koven.shell.patchUi({
    navigation: {
      activePageId: navigation.activeId,
      sidebarSelectedId: navigation.sidebarSelectedId,
      preferencesSectionId
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
