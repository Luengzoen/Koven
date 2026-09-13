import { GeneralPane } from '@renderer/capabilities/preferences/general-pane'
import { usePreferencesNavStore } from '@renderer/capabilities/preferences/preferences-nav-store'
import { SystemPane } from '@renderer/capabilities/preferences/system-pane'
import { SearchField } from '@renderer/components/ui/search-field'
import { useT } from '@renderer/shell/use-t'
import { cn } from '@renderer/lib/cn'
import type { PreferencesSectionId } from '@shared/capabilities/shell'
import type { MessageKey } from '@shared/i18n'
import { MonitorIcon, Settings2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'

const sectionDefs = [
  { id: 'general' as const, labelKey: 'prefs.sectionGeneral' as const, Icon: Settings2Icon },
  { id: 'system' as const, labelKey: 'prefs.sectionSystem' as const, Icon: MonitorIcon }
] satisfies ReadonlyArray<{
  id: PreferencesSectionId
  labelKey: MessageKey
  Icon: typeof Settings2Icon
}>

export function PreferencesPage() {
  const activeId = usePreferencesNavStore((state) => state.sectionId)
  const setSectionId = usePreferencesNavStore((state) => state.setSectionId)
  const [query, setQuery] = useState('')
  const t = useT()

  const sections = useMemo(
    () =>
      sectionDefs.map((section) => ({
        ...section,
        label: t(section.labelKey)
      })),
    [t]
  )

  const visibleSections = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return sections
    return sections.filter((section) => section.label.toLowerCase().includes(trimmed))
  }, [query, sections])

  return (
    <div className="flex h-full min-h-0 bg-background">
      <aside className="flex w-56 shrink-0 flex-col gap-3 border-r border-border bg-muted/40 p-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={t('prefs.searchSettings')}
          aria-label={t('prefs.searchSettings')}
          frameClassName="h-8 bg-background py-0"
          inputClassName="h-full"
        />

        <nav className="flex flex-col gap-0.5" aria-label={t('prefs.settingsSections')}>
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
            <p className="px-2.5 py-2 text-xs text-muted-foreground">
              {t('prefs.noMatchingSections')}
            </p>
          ) : null}
        </nav>
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
        {activeId === 'general' ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('prefs.sectionGeneral')}
            </h1>
            <GeneralPane />
          </div>
        ) : null}
        {activeId === 'system' ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('prefs.sectionSystem')}
            </h1>
            <SystemPane />
          </div>
        ) : null}
      </div>
    </div>
  )
}
