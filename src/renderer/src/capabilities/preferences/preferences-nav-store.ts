import { create } from 'zustand'
import {
  normalizePreferencesSectionId,
  type PreferencesSectionId
} from '@shared/capabilities/shell'

type PreferencesNavState = {
  sectionId: PreferencesSectionId
  setSectionId: (id: PreferencesSectionId) => void
  hydrate: (sectionId: PreferencesSectionId) => void
}

export const usePreferencesNavStore = create<PreferencesNavState>((set) => ({
  sectionId: 'general',
  setSectionId: (sectionId) => set({ sectionId }),
  hydrate: (sectionId) => set({ sectionId: normalizePreferencesSectionId(sectionId) })
}))
