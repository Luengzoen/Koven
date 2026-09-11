import type { Result } from '../kernel/result'
import type { LocaleId } from '../i18n/locale'
import { defaultLocale, normalizeLocale } from '../i18n/locale'

export type { LocaleId }
export { defaultLocale, normalizeLocale }

export const preferencesIpc = {
  get: 'preferences:get',
  set: 'preferences:set',
  /** 立刻同步 nativeTheme / WCO，不等落盘 */
  applyTheme: 'preferences:apply-theme'
} as const

export type ThemePreference = 'system' | 'light' | 'dark'

export type FontFamilyId =
  | 'microsoft-yahei'
  | 'simsun'
  | 'simhei'
  | 'kaiti'
  | 'fangsong'
  | 'dengxian'

export type FontSizeId = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 点窗口关闭钮时的行为 */
export type CloseBehavior = 'tray' | 'quit'

export type GeneralPreferences = {
  fontFamily: FontFamilyId
  fontSize: FontSizeId
  closeBehavior: CloseBehavior
}

export const fontFamilyOptions = [
  {
    id: 'microsoft-yahei',
    label: '微软雅黑',
    cssFamily: '"Microsoft YaHei", "微软雅黑", sans-serif'
  },
  {
    id: 'simsun',
    label: '宋体',
    cssFamily: 'SimSun, "宋体", serif'
  },
  {
    id: 'simhei',
    label: '黑体',
    cssFamily: 'SimHei, "黑体", sans-serif'
  },
  {
    id: 'kaiti',
    label: '楷体',
    cssFamily: 'KaiTi, "楷体", serif'
  },
  {
    id: 'fangsong',
    label: '仿宋',
    cssFamily: 'FangSong, "仿宋", serif'
  },
  {
    id: 'dengxian',
    label: '等线',
    cssFamily: 'DengXian, "等线", sans-serif'
  }
] as const satisfies ReadonlyArray<{
  id: FontFamilyId
  label: string
  cssFamily: string
}>

export const fontSizeOptions = [
  { id: 'xs', label: '极小', scale: 0.85 },
  { id: 'sm', label: '小', scale: 0.925 },
  { id: 'md', label: '标准', scale: 1 },
  { id: 'lg', label: '稍大', scale: 1.075 },
  { id: 'xl', label: '大', scale: 1.15 }
] as const satisfies ReadonlyArray<{
  id: FontSizeId
  label: string
  scale: number
}>

export const defaultGeneralPreferences: GeneralPreferences = {
  fontFamily: 'microsoft-yahei',
  fontSize: 'md',
  closeBehavior: 'tray'
}

const fontFamilyIds: ReadonlySet<string> = new Set(fontFamilyOptions.map((o) => o.id))
const fontSizeIds: ReadonlySet<string> = new Set(fontSizeOptions.map((o) => o.id))
const closeBehaviors: ReadonlySet<string> = new Set(['tray', 'quit'])

export function normalizeGeneralPreferences(raw: unknown): GeneralPreferences {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...defaultGeneralPreferences }
  }
  const record = raw as Record<string, unknown>
  const fontFamily =
    typeof record.fontFamily === 'string' && fontFamilyIds.has(record.fontFamily)
      ? (record.fontFamily as FontFamilyId)
      : defaultGeneralPreferences.fontFamily
  const fontSize =
    typeof record.fontSize === 'string' && fontSizeIds.has(record.fontSize)
      ? (record.fontSize as FontSizeId)
      : defaultGeneralPreferences.fontSize
  const closeBehavior =
    typeof record.closeBehavior === 'string' && closeBehaviors.has(record.closeBehavior)
      ? (record.closeBehavior as CloseBehavior)
      : defaultGeneralPreferences.closeBehavior
  return { fontFamily, fontSize, closeBehavior }
}

export function fontFamilyCss(id: FontFamilyId): string {
  return fontFamilyOptions.find((o) => o.id === id)?.cssFamily ?? fontFamilyOptions[0].cssFamily
}

export function fontSizeScale(id: FontSizeId): number {
  return fontSizeOptions.find((o) => o.id === id)?.scale ?? 1
}

export type PreferencesSnapshot = {
  version: 1
  theme: ThemePreference
  locale: LocaleId
  general: GeneralPreferences
}

export type PreferencesAPI = {
  preferences: {
    get: () => Promise<Result<PreferencesSnapshot>>
    set: (patch: Partial<Omit<PreferencesSnapshot, 'version'>>) => Promise<Result<PreferencesSnapshot>>
    applyTheme: (theme: ThemePreference) => void
  }
}
