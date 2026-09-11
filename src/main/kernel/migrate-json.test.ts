import { describe, expect, it } from 'vitest'
import { migrateJson } from './migrate-json'

describe('migrateJson', () => {
  const steps = [
    (raw: Record<string, unknown>) => ({ ...raw, legacy: true }),
    (raw: Record<string, unknown>) => {
      const { legacy: _legacy, ...rest } = raw
      return { ...rest, theme: 'system' }
    }
  ]

  it('treats missing version as 0 and runs all steps', () => {
    const result = migrateJson({ foo: 1 }, 2, steps)
    expect(result.migrated).toBe(true)
    expect(result.fromVersion).toBe(0)
    expect(result.toVersion).toBe(2)
    expect(result.value).toEqual({ foo: 1, theme: 'system', version: 2 })
  })

  it('does not mark migrated when already current', () => {
    const result = migrateJson({ version: 2, theme: 'dark' }, 2, steps)
    expect(result.migrated).toBe(false)
    expect(result.value.version).toBe(2)
    expect(result.value.theme).toBe('dark')
  })

  it('runs only remaining steps from mid version', () => {
    const result = migrateJson({ version: 1, legacy: true }, 2, steps)
    expect(result.migrated).toBe(true)
    expect(result.fromVersion).toBe(1)
    expect(result.value).toEqual({ theme: 'system', version: 2 })
  })
})
