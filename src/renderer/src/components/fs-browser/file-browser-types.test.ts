import { describe, expect, it } from 'vitest'
import { entryIsSelectable, parseAcceptExtensions } from './file-browser-types'

describe('parseAcceptExtensions', () => {
  it('parses semicolon patterns', () => {
    expect([...parseAcceptExtensions('*.png;*.JPG')!].sort()).toEqual(['jpg', 'png'])
  })

  it('treats *.* as unrestricted', () => {
    expect(parseAcceptExtensions('*.*')).toBeNull()
  })

  it('accepts array form', () => {
    expect([...parseAcceptExtensions(['.ts', '*.tsx'])!].sort()).toEqual(['ts', 'tsx'])
  })
})

describe('entryIsSelectable', () => {
  const file = {
    path: 'C:\\a\\b.png',
    name: 'b.png',
    kind: 'file' as const,
    extension: 'png',
    isHidden: false,
    isSystem: false
  }
  const dir = {
    path: 'C:\\a',
    name: 'a',
    kind: 'directory' as const,
    extension: '',
    isHidden: false,
    isSystem: false
  }

  it('respects directory mode', () => {
    expect(entryIsSelectable(dir, 'directory', null)).toBe(true)
    expect(entryIsSelectable(file, 'directory', null)).toBe(false)
  })

  it('filters files by accept', () => {
    const accept = parseAcceptExtensions('*.png')
    expect(entryIsSelectable(file, 'file', accept)).toBe(true)
    expect(
      entryIsSelectable({ ...file, extension: 'txt', name: 'b.txt' }, 'file', accept)
    ).toBe(false)
  })
})
