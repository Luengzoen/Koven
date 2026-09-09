import { ipcRenderer } from 'electron'
import { appInfoIpc, type AppInfoAPI } from '@shared/capabilities/app-info'

export const appInfoApi: AppInfoAPI = {
  appInfo: {
    get: () => ipcRenderer.invoke(appInfoIpc.get)
  }
}
