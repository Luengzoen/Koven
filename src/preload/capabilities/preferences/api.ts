import { ipcRenderer } from 'electron'
import {
  preferencesIpc,
  type PreferencesAPI,
  type PreferencesSnapshot
} from '@shared/capabilities/preferences'

export const preferencesApi: PreferencesAPI = {
  preferences: {
    get: () => ipcRenderer.invoke(preferencesIpc.get),
    set: (patch: Partial<Omit<PreferencesSnapshot, 'version'>>) =>
      ipcRenderer.invoke(preferencesIpc.set, patch)
  }
}
