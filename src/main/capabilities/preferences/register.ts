import { ipcMain } from 'electron'
import { ok } from '@shared/kernel/result'
import { preferencesIpc, type PreferencesSnapshot } from '@shared/capabilities/preferences'
import { loadPreferences, patchPreferences } from './preferences-store'

export function registerPreferences(): void {
  ipcMain.handle(preferencesIpc.get, () => ok(loadPreferences()))

  ipcMain.handle(preferencesIpc.set, (_event, patch: unknown) => {
    if (!patch || typeof patch !== 'object') {
      return ok(loadPreferences())
    }
    return ok(patchPreferences(patch as Partial<Omit<PreferencesSnapshot, 'version'>>))
  })
}
