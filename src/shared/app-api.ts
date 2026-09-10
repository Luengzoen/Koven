import type { AppInfoAPI } from './capabilities/app-info'
import type { PreferencesAPI } from './capabilities/preferences'
import type { ShellAPI } from './capabilities/shell'

export type AppAPI = AppInfoAPI & ShellAPI & PreferencesAPI

export type { AppInfo } from './capabilities/app-info'
export type { PreferencesSnapshot, ThemePreference } from './capabilities/preferences'
export type { AppError, Result } from './kernel/result'
export type { ShellSnapshot, ShellUiPatch } from './capabilities/shell'
