import {
  defaultGeneralPreferences,
  normalizeGeneralPreferences,
  type PreferencesSnapshot,
  type ThemePreference
} from '@shared/capabilities/preferences'
import { appLog } from '../../kernel/app-log'
import { migrateJson, type MigrationStep } from '../../kernel/migrate-json'
import { readJson, writeJson } from '../../kernel/storage'

const CAPABILITY = 'preferences'
const FILE = 'preferences.json'
export const PREFERENCES_SCHEMA_VERSION = 1

/** steps[i]: version i → i+1 */
export const preferencesMigrations: readonly MigrationStep[] = [
  // 0 → 1: unversioned / legacy blobs become v1 before normalize
  (raw) => raw
]

const themes: ReadonlySet<ThemePreference> = new Set(['system', 'light', 'dark'])

export function createDefaultPreferences(): PreferencesSnapshot {
  return {
    version: PREFERENCES_SCHEMA_VERSION,
    theme: 'system',
    locale: 'zh-CN',
    general: { ...defaultGeneralPreferences }
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

  const general = normalizeGeneralPreferences(record.general)

  return {
    version: PREFERENCES_SCHEMA_VERSION,
    theme,
    locale,
    general
  }
}

export function loadPreferences(): PreferencesSnapshot {
  const result = readJson<unknown>(CAPABILITY, FILE)
  if (!result.ok) return createDefaultPreferences()

  const migrated = migrateJson(
    result.value,
    PREFERENCES_SCHEMA_VERSION,
    preferencesMigrations
  )
  const normalized = normalizePreferences(migrated.value)

  if (migrated.migrated) {
    const written = writeJson(CAPABILITY, FILE, normalized)
    if (!written.ok) {
      appLog.error('preferences', `migrate write failed: ${written.error.message}`)
    } else {
      appLog.info(
        'preferences',
        `migrated preferences.json v${migrated.fromVersion} → v${migrated.toVersion}`
      )
    }
  }

  return normalized
}

export function savePreferences(snapshot: PreferencesSnapshot): PreferencesSnapshot {
  const normalized = normalizePreferences(snapshot)
  const written = writeJson(CAPABILITY, FILE, normalized)
  if (!written.ok) {
    appLog.error('preferences', `save failed: ${written.error.message}`)
  }
  return normalized
}

export function patchPreferences(
  patch: Partial<Omit<PreferencesSnapshot, 'version'>>
): PreferencesSnapshot {
  const current = loadPreferences()
  return savePreferences({
    version: PREFERENCES_SCHEMA_VERSION,
    theme: patch.theme ?? current.theme,
    locale: patch.locale ?? current.locale,
    general: patch.general
      ? normalizeGeneralPreferences({ ...current.general, ...patch.general })
      : current.general
  })
}
