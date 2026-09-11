import { create } from 'zustand'
import {
  defaultGeneralPreferences,
  defaultLocale,
  type GeneralPreferences,
  type LocaleId,
  type PreferencesSnapshot,
  type ThemePreference
} from '@shared/capabilities/preferences'

type PreferencesState = PreferencesSnapshot & {
  hydrate: (snapshot: PreferencesSnapshot) => void
  setTheme: (theme: ThemePreference) => void
  setLocale: (locale: LocaleId) => void
  setGeneral: (general: GeneralPreferences) => void
  patchGeneral: (patch: Partial<GeneralPreferences>) => void
}

const defaults: PreferencesSnapshot = {
  version: 1,
  theme: 'system',
  locale: defaultLocale,
  general: { ...defaultGeneralPreferences }
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  ...defaults,
  hydrate: (snapshot) => set({ ...snapshot }),
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  setGeneral: (general) => set({ general }),
  patchGeneral: (patch) =>
    set((state) => ({
      general: { ...state.general, ...patch }
    }))
}))
