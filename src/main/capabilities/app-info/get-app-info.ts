import { app } from 'electron'
import { ok, type Result } from '@shared/kernel/result'
import type { AppInfo } from '@shared/capabilities/app-info'
import { dataRoot } from '../../env'

export function getAppInfo(): Result<AppInfo> {
  return ok({
    name: app.getName(),
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    dataRoot
  })
}
