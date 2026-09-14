import { useProjectsStore } from '@renderer/capabilities/projects/projects-store'
import { SearchField } from '@renderer/components/ui/search-field'
import { useT } from '@renderer/shell/use-t'
import { useEffect, useRef, useState } from 'react'

export function SidebarSearch() {
  const t = useT()
  const [query, setQuery] = useState('')
  const setSearchQuery = useProjectsStore((state) => state.setSearchQuery)
  const runSearch = useProjectsStore((state) => state.runSearch)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setSearchQuery(query)
      void runSearch(query)
    }, 200)
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current)
    }
  }, [query, runSearch, setSearchQuery])

  return (
    <div className="shrink-0 px-2 pb-2">
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder={t('nav.searchPlaceholder')}
        aria-label={t('common.search')}
        frameClassName="bg-background/80 text-muted-foreground"
      />
    </div>
  )
}
