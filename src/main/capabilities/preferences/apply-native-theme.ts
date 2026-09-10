import { BrowserWindow, nativeTheme } from 'electron'
import type { ThemePreference } from '@shared/capabilities/preferences'
import { applyTitleBarOverlay } from '../../kernel/title-bar-overlay'

function overlayDarkFromPreference(theme: ThemePreference): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return nativeTheme.shouldUseDarkColors
}

/** 立刻改 themeSource，并按偏好同步所有窗口 WCO（不等 updated 事件） */
export function applyNativeThemeSource(theme: ThemePreference): void {
  nativeTheme.themeSource = theme
  const dark = overlayDarkFromPreference(theme)
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed()) continue
    applyTitleBarOverlay(win, dark)
  }
}
