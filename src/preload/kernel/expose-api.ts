import { contextBridge } from 'electron'
import type { AppAPI } from '@shared/app-api'

export function exposeApi(api: AppAPI): void {
  contextBridge.exposeInMainWorld('koven', api)
}
