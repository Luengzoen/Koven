import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetDataRootAfterTests, setDataRootForTests } from '../env'
import { readJson, writeJson } from './storage'

describe('storage', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'koven-storage-'))
    setDataRootForTests(dir)
  })

  afterEach(() => {
    resetDataRootAfterTests()
    rmSync(dir, { recursive: true, force: true })
  })

  it('rejects invalid capability names', () => {
    const result = writeJson('../x', 'a.json', {})
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('storage.invalid-capability')
    }
  })

  it('round-trips json via atomic write', () => {
    const written = writeJson('shell', 'snapshot.json', { version: 1, ok: true })
    expect(written.ok).toBe(true)
    const read = readJson<{ version: number; ok: boolean }>('shell', 'snapshot.json')
    expect(read.ok).toBe(true)
    if (read.ok) {
      expect(read.value).toEqual({ version: 1, ok: true })
    }
    const text = readFileSync(join(dir, 'capabilities', 'shell', 'snapshot.json'), 'utf8')
    expect(text).toContain('"ok": true')
  })
})
