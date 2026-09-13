import type { ColumnState } from '@renderer/components/fs-browser/use-browser-columns'
import type {
  FsBrowserEntryKind,
  FsBrowserListEntry
} from '@shared/capabilities/fs-browser'

function samePath(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

/** 按 resolve 链展开分栏，并返回应对齐的聚焦项 */
export async function expandColumnsToPath(options: {
  chain: string[]
  focusPath: string
  focusKind: FsBrowserEntryKind | null
  rootEntries: FsBrowserListEntry[]
  loadDirectory: (path: string) => Promise<FsBrowserListEntry[]>
}): Promise<{ columns: ColumnState[]; focused: FsBrowserListEntry | null }> {
  const { chain, focusPath, focusKind, rootEntries, loadDirectory } = options
  const listChain =
    focusKind === 'file' && chain.length > 0 ? chain.slice(0, -1) : chain

  const columns: ColumnState[] = [
    { path: null, entries: rootEntries, loading: false }
  ]
  for (const step of listChain) {
    const entries = await loadDirectory(step)
    columns.push({ path: step, entries, loading: false })
  }

  if (focusKind === 'file') {
    const last = columns[columns.length - 1]
    return {
      columns,
      focused:
        last?.entries.find((entry) => samePath(entry.path, focusPath)) ?? null
    }
  }

  const parentIndex = Math.max(0, listChain.length - 1)
  return {
    columns,
    focused:
      columns[parentIndex]?.entries.find((entry) =>
        samePath(entry.path, focusPath)
      ) ?? null
  }
}
