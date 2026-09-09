import type { Result } from '../kernel/result'

export const appInfoIpc = {
  get: 'app-info:get'
} as const

export type AppInfo = {
  name: string
  version: string
  electronVersion: string
  chromeVersion: string
  nodeVersion: string
  dataRoot: string
}

export type AppInfoAPI = {
  appInfo: {
    get: () => Promise<Result<AppInfo>>
  }
}
