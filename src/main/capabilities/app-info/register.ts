import { ipcMain } from 'electron'
import { appInfoIpc } from '@shared/capabilities/app-info'
import { getAppInfo } from './get-app-info'

export function registerAppInfo(): void {
  ipcMain.handle(appInfoIpc.get, () => getAppInfo())
}
