import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { writeFileAtomic } from './atomic-file-write'

describe('writeFileAtomic', () => {
  let dir: string

  afterEach(() => {
    if (dir) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('creates a new file', () => {
    dir = mkdtempSync(join(tmpdir(), 'koven-atomic-'))
    const target = join(dir, 'a.json')
    const result = writeFileAtomic(target, '{"ok":true}\n')
    expect(result.ok).toBe(true)
    expect(readFileSync(target, 'utf8')).toBe('{"ok":true}\n')
    expect(existsSync(`${target}.tmp`)).toBe(false)
    expect(existsSync(`${target}.bak`)).toBe(false)
  })

  it('replaces an existing file without leaving tmp', () => {
    dir = mkdtempSync(join(tmpdir(), 'koven-atomic-'))
    const target = join(dir, 'b.json')
    writeFileSync(target, 'old\n', 'utf8')
    const result = writeFileAtomic(target, 'new\n')
    expect(result.ok).toBe(true)
    expect(readFileSync(target, 'utf8')).toBe('new\n')
    expect(existsSync(`${target}.tmp`)).toBe(false)
    expect(existsSync(`${target}.bak`)).toBe(false)
  })
})
