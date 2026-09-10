import type { Result } from '../kernel/result'

export const preferencesIpc = {
  get: 'preferences:get',
  set: 'preferences:set'
} as const

export type ThemePreference = 'system' | 'light' | 'dark'

export type PreferencesSnapshot = {
  version: 1
  theme: ThemePreference
  locale: string
  /** 细设置预留；键为设置项 id */
  general: Record<string, unknown>
}

export type PreferencesAPI = {
  preferences: {
    get: () => Promise<Result<PreferencesSnapshot>>
    set: (patch: Partial<Omit<PreferencesSnapshot, 'version'>>) => Promise<Result<PreferencesSnapshot>>
  }
}
