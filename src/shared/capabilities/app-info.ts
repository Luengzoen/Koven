import type { Result } from '../kernel/result'

export const appInfoIpc = {
  get: 'app-info:get'
} as const

/** 给「关于」用的最小应用信息（不暴露运行时/路径细节） */
export type AppInfo = {
  name: string
  version: string
}

export type AppInfoAPI = {
  appInfo: {
    get: () => Promise<Result<AppInfo>>
  }
}
