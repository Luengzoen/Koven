import { describe, expect, it } from 'vitest'
import { normalizeLocale, t } from '../i18n'

describe('i18n', () => {
  it('normalizes unknown locale to zh-CN', () => {
    expect(normalizeLocale('fr')).toBe('zh-CN')
    expect(normalizeLocale('en')).toBe('en')
  })

  it('interpolates params', () => {
    expect(t('zh-CN', 'about.version', { v: '1.2.3' })).toBe('版本 1.2.3')
    expect(t('en', 'about.version', { v: '1.2.3' })).toBe('Version 1.2.3')
  })
})
