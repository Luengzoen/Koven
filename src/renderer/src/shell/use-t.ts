import { t, type MessageKey, type TParams } from '@shared/i18n'
import type { LocaleId } from '@shared/i18n'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { useCallback } from 'react'

export function useT(): (key: MessageKey, params?: TParams) => string {
  const locale = usePreferencesStore((state) => state.locale)
  return useCallback((key: MessageKey, params?: TParams) => t(locale, key, params), [locale])
}

export function useLocale(): LocaleId {
  return usePreferencesStore((state) => state.locale)
}
