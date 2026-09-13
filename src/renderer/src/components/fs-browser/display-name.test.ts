import { describe, expect, it } from 'vitest'
import { displayEntryName, isShortcutEntry } from './display-name'

describe('displayEntryName', () => {
  it('strips .lnk extension from display name', () => {
    expect(
      displayEntryName({ name: 'Chrome.lnk', extension: 'lnk' })
    ).toBe('Chrome')
  })

  it('keeps normal file names', () => {
    expect(displayEntryName({ name: 'notes.txt', extension: 'txt' })).toBe('notes.txt')
  })
})

describe('isShortcutEntry', () => {
  it('detects lnk files', () => {
    expect(isShortcutEntry({ kind: 'file', extension: 'lnk' })).toBe(true)
    expect(isShortcutEntry({ kind: 'directory', extension: 'lnk' })).toBe(false)
  })
})
