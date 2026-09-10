import { GeneralPane } from '@renderer/capabilities/preferences/general-pane'
import { usePreferencesNavStore } from '@renderer/capabilities/preferences/preferences-nav-store'
import { SystemPane } from '@renderer/capabilities/preferences/system-pane'
import { cn } from '@renderer/lib/cn'
import type { PreferencesSectionId } from '@shared/capabilities/shell'
import { MonitorIcon, SearchIcon, Settings2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'

const sections = [
  { id: 'general' as const, label: 'General', Icon: Settings2Icon },
  { id: 'system' as const, label: 'System', Icon: MonitorIcon }
] satisfies ReadonlyArray<{
  id: PreferencesSectionId
  label: string
  Icon: typeof Settings2Icon
}>

export function PreferencesPage() {
  const activeId = usePreferencesNavStore((state) => state.sectionId)
  const setSectionId = usePreferencesNavStore((state) => state.setSectionId)
  const [query, setQuery] = useState('')

  const visibleSections = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return sections
    return sections.filter((section) => section.label.toLowerCase().includes(trimmed))
  }, [query])

  return (
    <div className="flex h-full min-h-0 bg-background">
      <aside className="flex w-56 shrink-0 flex-col gap-3 border-r border-border bg-muted/40 p-3">
        <label className="relative block">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索设置"
            className="h-8 w-full rounded-md border border-border bg-background pr-2.5 pl-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <nav className="flex flex-col gap-0.5" aria-label="设置分类">
          {visibleSections.map(({ id, label, Icon }) => {
            const active = id === activeId
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSectionId(id)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors',
                  active
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
          {visibleSections.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-muted-foreground">没有匹配的分类</p>
          ) : null}
        </nav>
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
        {activeId === 'general' ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">General</h1>
            <GeneralPane />
          </div>
        ) : null}
        {activeId === 'system' ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">System</h1>
            <SystemPane />
          </div>
        ) : null}
      </div>
    </div>
  )
}
