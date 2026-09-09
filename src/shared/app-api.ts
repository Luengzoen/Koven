import type { AppInfoAPI } from './capabilities/app-info'
import type { ShellAPI } from './capabilities/shell'

export type AppAPI = AppInfoAPI & ShellAPI

export type { AppInfo } from './capabilities/app-info'
export type { AppError, Result } from './kernel/result'
