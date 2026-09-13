import type { AppInfoAPI } from './capabilities/app-info'
import type { PreferencesAPI } from './capabilities/preferences'
import type { ShellAPI } from './capabilities/shell'
import type { FsBrowserAPI } from './capabilities/fs-browser'

export type AppAPI = AppInfoAPI & ShellAPI & PreferencesAPI & FsBrowserAPI

export type { AppInfo } from './capabilities/app-info'
export type {
  CloseBehavior,
  FontFamilyId,
  FontSizeId,
  GeneralPreferences,
  PreferencesSnapshot,
  ThemePreference
} from './capabilities/preferences'
export type { AppError, Result } from './kernel/result'
export type { ShellSnapshot, ShellUiPatch, PreferencesSectionId } from './capabilities/shell'
