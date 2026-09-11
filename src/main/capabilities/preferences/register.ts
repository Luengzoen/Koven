import { ipcMain } from 'electron'
import { ok } from '@shared/kernel/result'
import {
  preferencesIpc,
  type PreferencesSnapshot,
  type ThemePreference
} from '@shared/capabilities/preferences'
import { refreshTrayMenu } from '../../kernel/tray'
import { applyNativeThemeSource } from './apply-native-theme'
import { loadPreferences, patchPreferences } from './preferences-store'

const themes: ReadonlySet<ThemePreference> = new Set(['system', 'light', 'dark'])

export function registerPreferences(): void {
  applyNativeThemeSource(loadPreferences().theme)

  ipcMain.handle(preferencesIpc.get, () => ok(loadPreferences()))

  ipcMain.on(preferencesIpc.applyTheme, (_event, theme: unknown) => {
    if (typeof theme !== 'string' || !themes.has(theme as ThemePreference)) return
    applyNativeThemeSource(theme as ThemePreference)
  })

  ipcMain.handle(preferencesIpc.set, (_event, patch: unknown) => {
    if (!patch || typeof patch !== 'object') {
      return ok(loadPreferences())
    }
    const previous = loadPreferences()
    // 只落盘；WCO / nativeTheme 由 preferences:apply-theme 控制时机（等扩散圆碰到右上角）
    const next = patchPreferences(patch as Partial<Omit<PreferencesSnapshot, 'version'>>)
    if (previous.locale !== next.locale) {
      refreshTrayMenu()
    }
    return ok(next)
  })
}
