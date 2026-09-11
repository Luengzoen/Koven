import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  loadPreferences,
  PREFERENCES_SCHEMA_VERSION
} from '../capabilities/preferences/preferences-store'
import { resetDataRootAfterTests, setDataRootForTests } from '../env'
import { mkdirSync } from 'node:fs'

describe('preferences migrate load', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'koven-pref-'))
    setDataRootForTests(dir)
    mkdirSync(join(dir, 'capabilities', 'preferences'), { recursive: true })
  })

  afterEach(() => {
    resetDataRootAfterTests()
    rmSync(dir, { recursive: true, force: true })
  })

  it('upgrades unversioned json to current and writes back', () => {
    const file = join(dir, 'capabilities', 'preferences', 'preferences.json')
    writeFileSync(file, JSON.stringify({ theme: 'dark', locale: 'zh-CN' }), 'utf8')

    const loaded = loadPreferences()
    expect(loaded.version).toBe(PREFERENCES_SCHEMA_VERSION)
    expect(loaded.theme).toBe('dark')

    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as { version: number }
    expect(onDisk.version).toBe(PREFERENCES_SCHEMA_VERSION)
  })

  it('does not rewrite when already current', () => {
    const file = join(dir, 'capabilities', 'preferences', 'preferences.json')
    const before = `${JSON.stringify(
      {
        version: PREFERENCES_SCHEMA_VERSION,
        theme: 'light',
        locale: 'zh-CN',
        general: {
          fontFamily: 'microsoft-yahei',
          fontSize: 'md',
          closeBehavior: 'tray'
        }
      },
      null,
      2
    )}\n`
    writeFileSync(file, before, 'utf8')

    loadPreferences()
    expect(readFileSync(file, 'utf8')).toBe(before)
  })
})
