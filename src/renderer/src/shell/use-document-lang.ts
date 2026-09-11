import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { useEffect } from 'react'

/** Keep <html lang> in sync with preferences.locale */
export function useDocumentLang(): void {
  const locale = usePreferencesStore((state) => state.locale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
}
