import type { PreferencesSnapshot, ThemePreference } from '@shared/capabilities/preferences'
import { readJson, writeJson } from '../../kernel/storage'

const CAPABILITY = 'preferences'
const FILE = 'preferences.json'

const themes: ReadonlySet<ThemePreference> = new Set(['system', 'light', 'dark'])

export function createDefaultPreferences(): PreferencesSnapshot {
  return {
    version: 1,
    theme: 'system',
    locale: 'zh-CN',
    general: {}
  }
}

export function normalizePreferences(raw: unknown): PreferencesSnapshot {
  const defaults = createDefaultPreferences()
  if (!raw || typeof raw !== 'object') return defaults
  const record = raw as Record<string, unknown>

  const theme =
    typeof record.theme === 'string' && themes.has(record.theme as ThemePreference)
      ? (record.theme as ThemePreference)
      : defaults.theme

  const locale =
    typeof record.locale === 'string' && record.locale.length > 0
      ? record.locale
      : defaults.locale

  const general =
    record.general && typeof record.general === 'object' && !Array.isArray(record.general)
      ? (record.general as Record<string, unknown>)
      : defaults.general

  return {
    version: 1,
    theme,
    locale,
    general
  }
}

export function loadPreferences(): PreferencesSnapshot {
  const result = readJson<unknown>(CAPABILITY, FILE)
  if (!result.ok) return createDefaultPreferences()
  return normalizePreferences(result.value)
}

export function savePreferences(snapshot: PreferencesSnapshot): PreferencesSnapshot {
  const normalized = normalizePreferences(snapshot)
  writeJson(CAPABILITY, FILE, normalized)
  return normalized
}

export function patchPreferences(
  patch: Partial<Omit<PreferencesSnapshot, 'version'>>
): PreferencesSnapshot {
  const current = loadPreferences()
  return savePreferences({
    version: 1,
    theme: patch.theme ?? current.theme,
    locale: patch.locale ?? current.locale,
    general: patch.general ?? current.general
  })
}
