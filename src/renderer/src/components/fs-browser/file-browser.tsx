import { ColumnPane } from '@renderer/components/fs-browser/column-pane'
import { DetailPane } from '@renderer/components/fs-browser/detail-pane'
import { expandColumnsToPath } from '@renderer/components/fs-browser/expand-to-path'
import {
  entryIsSelectable,
  type FileBrowserProps
} from '@renderer/components/fs-browser/file-browser-types'
import { GoPathBar } from '@renderer/components/fs-browser/go-path-bar'
import {
  useBrowserLoaders,
  useInitialColumns
} from '@renderer/components/fs-browser/use-browser-columns'
import { useFileBrowserSelection } from '@renderer/components/fs-browser/use-file-browser-selection'
import { cn } from '@renderer/lib/cn'
import { useT } from '@renderer/shell/use-t'
import {
  FS_BROWSER_THIS_PC_PATH,
  type FsBrowserEntryDetail,
  type FsBrowserListEntry
} from '@shared/capabilities/fs-browser'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'

function canDrill(entry: FsBrowserListEntry): boolean {
  return (
    entry.kind === 'volume' ||
    entry.kind === 'directory' ||
    entry.kind === 'this-pc'
  )
}

function displayPathForEntry(entry: FsBrowserListEntry | null): string {
  if (!entry) return ''
  if (entry.path === FS_BROWSER_THIS_PC_PATH) return ''
  return entry.path
}

export function FileBrowser({
  title,
  maxCount = 1,
  mode = 'file',
  accept,
  initialPath,
  value,
  defaultValue,
  showHidden = true,
  showSystem = false,
  showDetail = true,
  columnWidth = 180,
  detailWidth = 220,
  height = 320,
  className,
  disabled = false,
  validate,
  onChange,
  onFocusChange,
  onNavigate,
  onConfirm,
  onCancel,
  onError,
  onDetailChange
}: FileBrowserProps) {
  const t = useT()
  const controlled = value !== undefined
  const [focused, setFocused] = useState<FsBrowserListEntry | null>(null)
  const [detail, setDetail] = useState<FsBrowserEntryDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [goPath, setGoPath] = useState(initialPath ?? '')
  const [goError, setGoError] = useState<string | null>(null)
  const focusSeq = useRef(0)
  const skipGoSync = useRef(false)
  const columnsScrollRef = useRef<HTMLDivElement>(null)
  const prevColumnsLen = useRef(0)

  const { acceptSet, loadRoots, loadDirectory } = useBrowserLoaders({
    showHidden,
    showSystem,
    accept,
    onError,
    t
  })

  const { selection, setSelection, emitSelection, selectWithModifiers, confirmSelection } =
    useFileBrowserSelection({
      controlled,
      value,
      maxCount,
      mode,
      acceptSet,
      focused,
      validate,
      onChange,
      onConfirm,
      setValidationMessage,
      overLimitMessage: (n) => t('fsBrowser.overLimit', { n }),
      emptyMessage: t('fsBrowser.emptySelection')
    })

  const { columns, setColumns } = useInitialColumns({
    loadRoots,
    loadDirectory,
    initialPath,
    defaultValue,
    value,
    controlled,
    onError,
    onNavigate,
    setSelection,
    onInitialFocus: (entry) => {
      setFocused(entry)
      if (entry && entryIsSelectable(entry, mode, acceptSet) && maxCount <= 1) {
        // 受控时 selection 已由 value 同步；非受控补一次
        if (!controlled) emitSelection([entry])
      }
    }
  })

  const selectedPaths = useMemo(
    () => new Set(selection.map((entry) => entry.path)),
    [selection]
  )

  useEffect(() => {
    if (!focused) {
      setDetail(null)
      setDetailLoading(false)
      onDetailChange?.(null)
      return
    }
    const seq = ++focusSeq.current
    setDetailLoading(true)
    ;(async () => {
      const result = await window.koven.fsBrowser.getEntryDetail(focused.path)
      if (seq !== focusSeq.current) return
      setDetailLoading(false)
      if (!result.ok) {
        setDetail(null)
        onError?.(result.error)
        onDetailChange?.(null)
        return
      }
      const nextDetail =
        focused.rootId === 'this-pc' || result.value.kind === 'this-pc'
          ? { ...result.value, name: t('fsBrowser.rootThisPc'), rootId: 'this-pc' as const }
          : focused.rootId
            ? { ...result.value, name: focused.name, rootId: focused.rootId }
            : result.value
      setDetail(nextDetail)
      onDetailChange?.(nextDetail)
    })()
  }, [focused, onDetailChange, onError, t])

  useEffect(() => {
    onFocusChange?.(focused)
  }, [focused, onFocusChange])

  useEffect(() => {
    if (skipGoSync.current) {
      skipGoSync.current = false
      return
    }
    setGoPath(displayPathForEntry(focused))
    setGoError(null)
  }, [focused])

  useEffect(() => {
    const el = columnsScrollRef.current
    const grew = columns.length > prevColumnsLen.current
    prevColumnsLen.current = columns.length
    if (!el || !grew) return
    requestAnimationFrame(() => {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
    })
  }, [columns.length])

  async function openEntry(entry: FsBrowserListEntry, columnIndex: number) {
    if (disabled) return
    setFocused(entry)
    setValidationMessage(null)
    if (!canDrill(entry)) return

    const kept = columns.slice(0, columnIndex + 1)
    setColumns([...kept, { path: entry.path, entries: [], loading: true }])
    const entries = await loadDirectory(entry.path)
    setColumns([...kept, { path: entry.path, entries, loading: false }])
    onNavigate?.([
      ...kept.slice(1).map((c) => c.path!).filter(Boolean),
      entry.path
    ])
  }

  async function handleGoSubmit(rawPath: string) {
    if (disabled) return
    if (!rawPath) {
      setGoError(t('fsBrowser.invalidPath'))
      return
    }

    const resolved = await window.koven.fsBrowser.resolvePath(rawPath)
    if (!resolved.ok) {
      setGoError(t('fsBrowser.invalidPath'))
      onError?.(resolved.error)
      return
    }
    if (!resolved.value.exists || resolved.value.chain.length === 0) {
      setGoError(t('fsBrowser.invalidPath'))
      return
    }

    setGoError(null)
    skipGoSync.current = true
    setGoPath(rawPath)

    const roots = columns[0]?.entries.length
      ? columns[0].entries
      : await loadRoots()
    const leaf = resolved.value.chain[resolved.value.chain.length - 1] ?? rawPath
    const expanded = await expandColumnsToPath({
      chain: resolved.value.chain,
      focusPath: leaf,
      focusKind: resolved.value.kind,
      rootEntries: roots,
      loadDirectory
    })
    setColumns(expanded.columns)
    onNavigate?.(
      resolved.value.kind === 'file'
        ? resolved.value.chain.slice(0, -1)
        : resolved.value.chain
    )
    if (expanded.focused) {
      setFocused(expanded.focused)
      if (entryIsSelectable(expanded.focused, mode, acceptSet) && maxCount <= 1) {
        emitSelection([expanded.focused])
      }
    }
  }

  function handleActivate(entry: FsBrowserListEntry, columnIndex: number) {
    if (canDrill(entry)) {
      void openEntry(entry, columnIndex)
      return
    }
    if (!entryIsSelectable(entry, mode, acceptSet)) return
    if (maxCount <= 1) {
      emitSelection([entry])
      void confirmSelection([entry])
    } else {
      selectWithModifiers(entry, columns[columnIndex]?.entries ?? [], {
        ctrlKey: false,
        metaKey: false,
        shiftKey: false
      })
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const target = event.target as HTMLElement | null
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

    if (event.key === 'Escape') {
      event.stopPropagation()
      onCancel?.()
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      void confirmSelection()
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-md border border-border bg-card',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
      style={{ height }}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label={title ?? t('fsBrowser.label')}
    >
      {title ? (
        <div className="shrink-0 border-b border-border px-3 py-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
        </div>
      ) : null}

      <GoPathBar
        value={goPath}
        onChange={(next) => {
          setGoPath(next)
          if (goError) setGoError(null)
        }}
        onSubmit={handleGoSubmit}
        error={goError}
        disabled={disabled}
      />

      <div className="flex min-h-0 flex-1">
        <div ref={columnsScrollRef} className="flex min-w-0 flex-1 overflow-x-auto">
          {columns.map((column, index) => (
            <ColumnPane
              key={column.path ?? '__roots__'}
              entries={column.entries}
              focusedPath={focused?.path ?? null}
              openChildPath={columns[index + 1]?.path ?? null}
              selectedPaths={selectedPaths}
              width={columnWidth}
              loading={column.loading}
              emptyLabel={
                column.loading ? t('fsBrowser.loading') : t('fsBrowser.columnEmpty')
              }
              onItemClick={(entry, event) => {
                setValidationMessage(null)
                const plainClick =
                  !event.ctrlKey && !event.metaKey && !event.shiftKey
                const wasSelected =
                  plainClick &&
                  selection.some(
                    (item) => item.path.toLowerCase() === entry.path.toLowerCase()
                  )

                selectWithModifiers(entry, column.entries, event)

                if (wasSelected) {
                  setFocused(null)
                  // 单选：取消选中后合起右侧分栏，icon 回到闭合态
                  if (maxCount <= 1) {
                    setColumns((prev) => prev.slice(0, index + 1))
                  }
                  return
                }

                setFocused(entry)
                if (canDrill(entry)) {
                  void openEntry(entry, index)
                } else {
                  setColumns((prev) => prev.slice(0, index + 1))
                }
              }}
              onActivate={(entry) => handleActivate(entry, index)}
            />
          ))}
        </div>
        {showDetail ? (
          <DetailPane detail={detail} width={detailWidth} loading={detailLoading} />
        ) : null}
      </div>
      {validationMessage ? (
        <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
          {validationMessage}
        </p>
      ) : null}
    </div>
  )
}
