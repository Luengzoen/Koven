export type MigrationStep = (raw: Record<string, unknown>) => Record<string, unknown>

export type MigrateJsonResult = {
  value: Record<string, unknown>
  fromVersion: number
  toVersion: number
  migrated: boolean
}

function readVersion(raw: unknown): number {
  if (!raw || typeof raw !== 'object') return 0
  const version = (raw as Record<string, unknown>).version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
    return 0
  }
  return version
}

/**
 * `steps[i]` migrates documents from version `i` to `i + 1`.
 * Missing / invalid version is treated as 0.
 */
export function migrateJson(
  raw: unknown,
  currentVersion: number,
  steps: readonly MigrationStep[]
): MigrateJsonResult {
  if (currentVersion < 0 || !Number.isInteger(currentVersion)) {
    throw new Error(`invalid currentVersion: ${currentVersion}`)
  }

  if (steps.length !== currentVersion) {
    throw new Error(
      `migration steps length (${steps.length}) must equal currentVersion (${currentVersion})`
    )
  }

  const fromVersion = readVersion(raw)
  let value: Record<string, unknown> =
    raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {}

  let version = fromVersion
  if (version > currentVersion) {
    value = { ...value, version: currentVersion }
    return {
      value,
      fromVersion,
      toVersion: currentVersion,
      migrated: fromVersion !== currentVersion
    }
  }

  while (version < currentVersion) {
    const step = steps[version]
    if (!step) {
      throw new Error(`missing migration step for version ${version}`)
    }
    value = step(value)
    version += 1
    value = { ...value, version }
  }

  return {
    value,
    fromVersion,
    toVersion: currentVersion,
    migrated: fromVersion !== currentVersion
  }
}
