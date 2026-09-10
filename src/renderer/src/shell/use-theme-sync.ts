import { useEffect } from 'react'
import { applyTheme } from '@renderer/shell/apply-theme'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import type { ThemePreference } from '@shared/capabilities/preferences'

function syncSystemChrome(theme: ThemePreference): void {
  window.koven?.preferences.applyTheme?.(theme)
}

/** 订阅偏好与系统配色，无动画同步到 DOM（用户点击切换走 applyTheme animate） */
export function useThemeSync(): void {
  const theme = usePreferencesStore((state) => state.theme)

  useEffect(() => {
    applyTheme({
      preference: theme,
      onReachSystemChrome: () => {
        syncSystemChrome(theme)
      }
    })

    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => {
      applyTheme({
        preference: 'system',
        onReachSystemChrome: () => {
          syncSystemChrome('system')
        }
      })
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])
}
