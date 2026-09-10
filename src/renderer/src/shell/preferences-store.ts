import { create } from 'zustand'
import type { PreferencesSnapshot, ThemePreference } from '@shared/capabilities/preferences'

type PreferencesState = PreferencesSnapshot & {
  hydrate: (snapshot: PreferencesSnapshot) => void
  setTheme: (theme: ThemePreference) => void
  setLocale: (locale: string) => void
  setGeneral: (general: Record<string, unknown>) => void
}

const defaults: PreferencesSnapshot = {
  version: 1,
  theme: 'system',
  locale: 'zh-CN',
  general: {}
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  ...defaults,
  hydrate: (snapshot) => set({ ...snapshot }),
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  setGeneral: (general) => set({ general })
}))
