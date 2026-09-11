import { catalogs, type MessageKey } from './catalog'
import { defaultLocale, normalizeLocale, type LocaleId } from './locale'

export type TParams = Record<string, string | number>

function interpolate(template: string, params?: TParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

export function t(locale: LocaleId | string, key: MessageKey, params?: TParams): string {
  const id = normalizeLocale(locale)
  const template = catalogs[id][key] ?? catalogs[defaultLocale][key] ?? key
  return interpolate(template, params)
}
