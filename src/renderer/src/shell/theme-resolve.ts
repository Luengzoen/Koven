import type { ThemePreference } from '@shared/capabilities/preferences'

export type ResolvedTheme = 'light' | 'dark'

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
