import { displayEntryName } from '@renderer/components/fs-browser/display-name'
import { EntryIcon } from '@renderer/components/fs-browser/entry-icon'
import type { FsBrowserListEntry } from '@shared/capabilities/fs-browser'
import { cn } from '@renderer/lib/cn'
import { useEffect, useRef, type MouseEvent } from 'react'

type ColumnPaneProps = {
  entries: FsBrowserListEntry[]
  focusedPath: string | null
  /** 下一列对应路径；等于某条目 path 时该条目为打开态（路径链伪选中） */
  openChildPath: string | null
  selectedPaths: Set<string>
  width: number
  loading: boolean
  emptyLabel: string
  onItemClick: (entry: FsBrowserListEntry, event: MouseEvent<HTMLButtonElement>) => void
  onActivate: (entry: FsBrowserListEntry) => void
}

function pathEquals(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

export function ColumnPane({
  entries,
  focusedPath,
  openChildPath,
  selectedPaths,
  width,
  loading,
  emptyLabel,
  onItemClick,
  onActivate
}: ColumnPaneProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const highlightPath =
    (focusedPath && entries.some((entry) => pathEquals(entry.path, focusedPath))
      ? focusedPath
      : null) ??
    (openChildPath && entries.some((entry) => pathEquals(entry.path, openChildPath))
      ? openChildPath
      : null)

  useEffect(() => {
    if (!highlightPath || !listRef.current) return
    const nodes = listRef.current.querySelectorAll<HTMLElement>('[data-entry-path]')
    for (const node of nodes) {
      if (pathEquals(node.dataset.entryPath ?? '', highlightPath)) {
        node.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        break
      }
    }
  }, [highlightPath, entries])

  return (
    <div
      className="flex shrink-0 flex-col border-r border-border"
      style={{ width }}
      role="listbox"
      aria-busy={loading}
      aria-multiselectable
    >
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-1">
        {entries.length === 0 && !loading ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">{emptyLabel}</p>
        ) : (
          entries.map((entry) => {
            const focused = focusedPath !== null && pathEquals(entry.path, focusedPath)
            const selected = [...selectedPaths].some((path) => pathEquals(path, entry.path))
            const open =
              openChildPath !== null && pathEquals(openChildPath, entry.path)
            // 路径链祖先：伪选中（弱于当前聚焦，强于普通行）
            const pathActive = open && !focused
            return (
              <button
                key={entry.path}
                type="button"
                role="option"
                data-entry-path={entry.path}
                aria-selected={selected || focused || open}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-sm outline-none',
                  // 暗色下 muted===card，路径链/选中必须用 accent，否则伪选中不可见
                  focused || selected || pathActive
                    ? 'bg-accent text-foreground'
                    : 'text-foreground hover:bg-accent/70',
                  entry.isHidden && 'opacity-45'
                )}
                onClick={(event) => onItemClick(entry, event)}
                onDoubleClick={() => onActivate(entry)}
              >
                <EntryIcon entry={entry} open={open} />
                <span className="min-w-0 flex-1 truncate">{displayEntryName(entry)}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
