import type { ResolvedTheme } from '@renderer/shell/theme-resolve'

export const lightTokens: Record<string, string> = {
  '--background': '#fafafa',
  '--foreground': '#18181b',
  '--muted': '#f4f4f5',
  '--muted-foreground': '#71717a',
  '--border': '#e4e4e7',
  '--card': '#ffffff',
  '--accent': '#f4f4f5',
  '--accent-foreground': '#18181b',
  '--titlebar': '#f4f4f5',
  '--ring': '#a1a1aa',
  '--primary': '#2563eb',
  '--primary-foreground': '#fafafa',
  '--success': '#16a34a',
  '--success-foreground': '#fafafa',
  '--danger': '#dc2626',
  '--danger-foreground': '#fafafa',
  '--warning': '#ca8a04',
  '--warning-foreground': '#18181b',
  '--info': '#52525b',
  '--info-foreground': '#fafafa'
}

export const darkTokens: Record<string, string> = {
  '--background': '#09090b',
  '--foreground': '#fafafa',
  '--muted': '#18181b',
  '--muted-foreground': '#a1a1aa',
  '--border': '#27272a',
  '--card': '#18181b',
  '--accent': '#27272a',
  '--accent-foreground': '#fafafa',
  '--titlebar': '#18181b',
  '--ring': '#a1a1aa',
  '--primary': '#3b82f6',
  '--primary-foreground': '#fafafa',
  '--success': '#22c55e',
  '--success-foreground': '#09090b',
  '--danger': '#ef4444',
  '--danger-foreground': '#fafafa',
  '--warning': '#eab308',
  '--warning-foreground': '#09090b',
  '--info': '#a1a1aa',
  '--info-foreground': '#09090b'
}

export function tokensFor(theme: ResolvedTheme): Record<string, string> {
  return theme === 'dark' ? darkTokens : lightTokens
}
