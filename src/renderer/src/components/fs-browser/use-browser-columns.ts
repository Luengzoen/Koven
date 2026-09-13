import { expandColumnsToPath } from '@renderer/components/fs-browser/expand-to-path'
import {
  entryMatchesAccept,
  parseAcceptExtensions,
  type FileBrowserProps
} from '@renderer/components/fs-browser/file-browser-types'
import { localizeRootEntries } from '@renderer/components/fs-browser/localize-root'
import type { MessageKey } from '@shared/i18n'
import type { FsBrowserListEntry } from '@shared/capabilities/fs-browser'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react'

export type ColumnState = {
  path: string | null
  entries: FsBrowserListEntry[]
  loading: boolean
}

type Loaders = {
  showHidden: boolean
  showSystem: boolean
  accept: FileBrowserProps['accept']
  onError?: FileBrowserProps['onError']
  t: (key: MessageKey) => string
}

export function useBrowserLoaders({
  showHidden,
  showSystem,
  accept,
  onError,
  t
}: Loaders) {
  const acceptSet = useMemo(() => parseAcceptExtensions(accept), [accept])

  const loadRoots = useCallback(async (): Promise<FsBrowserListEntry[]> => {
    const result = await window.koven.fsBrowser.listRoots()
    if (!result.ok) {
      onError?.(result.error)
      return []
    }
    return localizeRootEntries(result.value, t)
  }, [onError, t])

  const loadDirectory = useCallback(
    async (path: string): Promise<FsBrowserListEntry[]> => {
      const result = await window.koven.fsBrowser.listDirectory({
        path,
        showHidden,
        showSystem
      })
      if (!result.ok) {
        onError?.(result.error)
        return []
      }
      return result.value.entries.filter((entry) =>
        entryMatchesAccept(entry, acceptSet)
      )
    },
    [acceptSet, onError, showHidden, showSystem]
  )

  return { acceptSet, loadRoots, loadDirectory }
}

export function useInitialColumns(options: {
  loadRoots: () => Promise<FsBrowserListEntry[]>
  loadDirectory: (path: string) => Promise<FsBrowserListEntry[]>
  initialPath?: string
  defaultValue?: string[]
  value?: string[]
  controlled: boolean
  onError?: FileBrowserProps['onError']
  onNavigate?: FileBrowserProps['onNavigate']
  setSelection: (entries: FsBrowserListEntry[]) => void
  onInitialFocus?: (entry: FsBrowserListEntry | null) => void
}): {
  columns: ColumnState[]
  setColumns: Dispatch<SetStateAction<ColumnState[]>>
} {
  const [columns, setColumns] = useState<ColumnState[]>([
    { path: null, entries: [], loading: true }
  ])
  const {
    loadRoots,
    loadDirectory,
    initialPath,
    defaultValue,
    value,
    controlled,
    onError,
    onNavigate,
    setSelection,
    onInitialFocus
  } = options

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const roots = await loadRoots()
      if (cancelled) return
      setColumns([{ path: null, entries: roots, loading: false }])

      const seedPaths = value ?? defaultValue ?? []
      if (seedPaths.length > 0 && !controlled) {
        setSelection(
          seedPaths.map((path) => ({
            path,
            name: path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? path,
            kind: /^[A-Za-z]:\\$/.test(path)
              ? ('volume' as const)
              : ('directory' as const),
            extension: '',
            isHidden: false,
            isSystem: false
          }))
        )
      }

      const expandTarget = initialPath ?? seedPaths[0]
      if (!expandTarget) {
        onInitialFocus?.(null)
        return
      }

      const resolved = await window.koven.fsBrowser.resolvePath(expandTarget)
      if (!resolved.ok || cancelled) {
        if (!resolved.ok) onError?.(resolved.error)
        return
      }
      if (!resolved.value.exists || resolved.value.chain.length === 0) return

      const leaf =
        resolved.value.chain[resolved.value.chain.length - 1] ?? expandTarget
      const expanded = await expandColumnsToPath({
        chain: resolved.value.chain,
        focusPath: leaf,
        focusKind: resolved.value.kind,
        rootEntries: roots,
        loadDirectory
      })
      if (cancelled) return

      setColumns(expanded.columns)
      onNavigate?.(
        resolved.value.kind === 'file'
          ? resolved.value.chain.slice(0, -1)
          : resolved.value.chain
      )
      onInitialFocus?.(expanded.focused)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { columns, setColumns }
}
