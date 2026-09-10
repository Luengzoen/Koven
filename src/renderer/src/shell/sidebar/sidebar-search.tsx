import { SearchIcon } from 'lucide-react'

export function SidebarSearch() {
  return (
    <div className="shrink-0 px-2 pb-2">
      <label className="flex items-center gap-2 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-sm text-muted-foreground">
        <SearchIcon className="size-4 shrink-0" aria-hidden />
        <input
          type="search"
          readOnly
          placeholder="搜索..."
          aria-label="搜索"
          className="min-w-0 flex-1 cursor-default bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>
    </div>
  )
}
