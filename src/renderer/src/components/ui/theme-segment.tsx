import { applyTheme } from '@renderer/shell/apply-theme'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { useT } from '@renderer/shell/use-t'
import { cn } from '@renderer/lib/cn'
import type { ThemePreference } from '@shared/capabilities/preferences'
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

const thumbIndex: Record<ThemePreference, number> = {
  system: 0,
  light: 1,
  dark: 2
}

type ThemeSegmentProps = {
  className?: string
}

export function ThemeSegment({ className }: ThemeSegmentProps) {
  const theme = usePreferencesStore((state) => state.theme)
  const setTheme = usePreferencesStore((state) => state.setTheme)
  const activeIndex = thumbIndex[theme]
  const t = useT()

  const options = [
    { value: 'system' as const, label: t('nav.themeSystem'), Icon: MonitorIcon },
    { value: 'light' as const, label: t('nav.themeLight'), Icon: SunIcon },
    { value: 'dark' as const, label: t('nav.themeDark'), Icon: MoonIcon }
  ]

  const select = (value: ThemePreference, el: HTMLElement): void => {
    if (value === theme) return
    const rect = el.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    setTheme(value)
    applyTheme({
      preference: value,
      animate: true,
      x,
      y,
      onReachSystemChrome: () => {
        window.koven?.preferences.applyTheme?.(value)
      }
    })
    void window.koven?.preferences.set({ theme: value })
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('nav.theme')}
      className={cn(
        'relative inline-flex h-7 items-center rounded-md bg-background p-0.5 ring-1 ring-border',
        className
      )}
    >
      <span
        aria-hidden
        className="absolute top-0.5 left-0.5 size-6 rounded-sm bg-card shadow-sm ring-1 ring-border transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {options.map(({ value, label, Icon }) => {
        const selected = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={(event) => {
              select(value, event.currentTarget)
            }}
            className={cn(
              'relative z-10 inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors',
              'hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
              selected && 'text-foreground',
              '[&_svg]:size-3.5'
            )}
          >
            <Icon />
          </button>
        )
      })}
    </div>
  )
}
