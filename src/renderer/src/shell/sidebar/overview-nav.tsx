import { overviewPages, resolvePageTitle } from '@renderer/routes'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { useLocale, useT } from '@renderer/shell/use-t'
import { cn } from '@renderer/lib/cn'
import { CompassIcon, Clock3Icon, StarIcon, type LucideIcon } from 'lucide-react'

const overviewIcons: Record<string, LucideIcon> = {
  'overview:home': CompassIcon,
  'overview:recent': Clock3Icon,
  'overview:starred': StarIcon
}

export function OverviewNav() {
  const sidebarSelectedId = useNavigationStore((state) => state.sidebarSelectedId)
  const openFromSidebar = useNavigationStore((state) => state.openFromSidebar)
  const t = useT()
  const locale = useLocale()

  return (
    <section className="flex shrink-0 flex-col gap-1 px-2 pb-2" aria-label={t('nav.sectionOverview')}>
      <h2 className="shrink-0 px-2 text-xs font-medium tracking-wide text-muted-foreground">
        {t('nav.sectionOverview')}
      </h2>
      <nav className="flex flex-col gap-0.5">
        {overviewPages.map((entry) => {
          const Icon = overviewIcons[entry.id] ?? CompassIcon
          const active = sidebarSelectedId === entry.id
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => openFromSidebar(entry.id)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{resolvePageTitle(entry, locale)}</span>
            </button>
          )
        })}
      </nav>
    </section>
  )
}
