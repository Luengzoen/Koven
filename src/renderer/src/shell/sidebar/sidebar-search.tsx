import { SearchField } from '@renderer/components/ui/search-field'
import { useT } from '@renderer/shell/use-t'
import { useState } from 'react'

export function SidebarSearch() {
  const t = useT()
  const [query, setQuery] = useState('')

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
