export const localeIds = ['zh-CN', 'en'] as const

export type LocaleId = (typeof localeIds)[number]

export const defaultLocale: LocaleId = 'zh-CN'

const localeSet: ReadonlySet<string> = new Set(localeIds)

export function normalizeLocale(raw: unknown): LocaleId {
  if (typeof raw === 'string' && localeSet.has(raw)) {
    return raw as LocaleId
  }
  return defaultLocale
}

export function isLocaleId(raw: unknown): raw is LocaleId {
  return typeof raw === 'string' && localeSet.has(raw)
}
