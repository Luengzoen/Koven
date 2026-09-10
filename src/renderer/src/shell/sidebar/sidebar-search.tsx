import { SearchIcon } from 'lucide-react'

export function SidebarSearch() {
  return (
    <div className="shrink-0 px-2 pb-2">
      <label className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/80 px-2.5 py-1.5 text-sm text-zinc-400">
        <SearchIcon className="size-4 shrink-0" aria-hidden />
        <input
          type="search"
          readOnly
          placeholder="搜索..."
          aria-label="搜索"
          className="min-w-0 flex-1 cursor-default bg-transparent text-zinc-200 outline-none placeholder:text-zinc-500"
        />
      </label>
    </div>
  )
}
