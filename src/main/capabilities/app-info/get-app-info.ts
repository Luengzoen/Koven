import { app } from 'electron'
import { ok, type Result } from '@shared/kernel/result'
import type { AppInfo } from '@shared/capabilities/app-info'

export function getAppInfo(): Result<AppInfo> {
  return ok({
    name: app.getName(),
    version: app.getVersion()
  })
}
