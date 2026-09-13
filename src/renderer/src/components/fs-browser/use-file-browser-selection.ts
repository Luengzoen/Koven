import {
  entryIsSelectable,
  type FileBrowserProps
} from '@renderer/components/fs-browser/file-browser-types'
import type { FsBrowserListEntry, FsBrowserSelectionMode } from '@shared/capabilities/fs-browser'
import { useCallback, useEffect, useRef, useState } from 'react'

function samePath(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

function pathsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((path, index) => samePath(path, b[index]))
}

type ModifierKeys = {
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

type Options = {
  controlled: boolean
  value?: string[]
  maxCount: number
  mode: FsBrowserSelectionMode
  acceptSet: Set<string> | null
  focused: FsBrowserListEntry | null
  validate?: FileBrowserProps['validate']
  onChange?: FileBrowserProps['onChange']
  onConfirm?: FileBrowserProps['onConfirm']
  setValidationMessage: (message: string | null) => void
  overLimitMessage: (n: number) => string
  emptyMessage: string
}

export function useFileBrowserSelection({
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
  overLimitMessage,
  emptyMessage
}: Options) {
  const [selection, setSelection] = useState<FsBrowserListEntry[]>([])
  const selectionRef = useRef(selection)
  selectionRef.current = selection
  const anchorPathRef = useRef<string | null>(null)

  const emitSelection = useCallback(
    (next: FsBrowserListEntry[]) => {
      if (!controlled) setSelection(next)
      onChange?.(next)
    },
    [controlled, onChange]
  )

  useEffect(() => {
    if (!controlled || !value) return
    const next = value.map((path) => {
      const existing = selectionRef.current.find((entry) => samePath(entry.path, path))
      if (existing) return existing
      const name = path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? path
      const isVolume = /^[A-Za-z]:\\$/.test(path)
      return {
        path,
        name,
        kind: isVolume ? ('volume' as const) : ('directory' as const),
        extension: '',
        isHidden: false,
        isSystem: false
      }
    })
    if (
      !pathsEqual(
        next.map((e) => e.path),
        selectionRef.current.map((e) => e.path)
      )
    ) {
      setSelection(next)
    }
  }, [controlled, value])

  function selectWithModifiers(
    entry: FsBrowserListEntry,
    columnEntries: FsBrowserListEntry[],
    modifiers: ModifierKeys
  ) {
    if (!entryIsSelectable(entry, mode, acceptSet)) {
      anchorPathRef.current = entry.path
      return
    }
    setValidationMessage(null)

    if (maxCount <= 1) {
      const current = controlled ? selection : selectionRef.current
      if (current.length === 1 && samePath(current[0].path, entry.path)) {
        emitSelection([])
        return
      }
      emitSelection([entry])
      anchorPathRef.current = entry.path
      return
    }

    const additive = modifiers.ctrlKey || modifiers.metaKey
    const ranged = modifiers.shiftKey
    const current = controlled ? selection : selectionRef.current

    if (ranged && anchorPathRef.current) {
      const start = columnEntries.findIndex((item) =>
        samePath(item.path, anchorPathRef.current!)
      )
      const end = columnEntries.findIndex((item) => samePath(item.path, entry.path))
      if (start >= 0 && end >= 0) {
        const from = Math.min(start, end)
        const to = Math.max(start, end)
        const rangedEntries = columnEntries
          .slice(from, to + 1)
          .filter((item) => entryIsSelectable(item, mode, acceptSet))
        if (rangedEntries.length > maxCount) {
          setValidationMessage(overLimitMessage(maxCount))
          return
        }
        emitSelection(rangedEntries)
        return
      }
    }

    if (additive) {
      const exists = current.some((item) => samePath(item.path, entry.path))
      let next: FsBrowserListEntry[]
      if (exists) next = current.filter((item) => !samePath(item.path, entry.path))
      else if (current.length >= maxCount) {
        setValidationMessage(overLimitMessage(maxCount))
        return
      } else next = [...current, entry]
      emitSelection(next)
      anchorPathRef.current = entry.path
      return
    }

    // plain click：再次点已选项 → 取消选中
    if (current.length === 1 && samePath(current[0].path, entry.path)) {
      emitSelection([])
      return
    }

    emitSelection([entry])
    anchorPathRef.current = entry.path
  }

  async function confirmSelection(explicit?: FsBrowserListEntry[]) {
    let next = explicit ?? (controlled ? selection : selectionRef.current)
    if (next.length === 0 && focused && entryIsSelectable(focused, mode, acceptSet)) {
      next = [focused]
      emitSelection(next)
    }
    if (next.length === 0) {
      setValidationMessage(emptyMessage)
      return
    }
    if (next.length > maxCount) {
      setValidationMessage(overLimitMessage(maxCount))
      return
    }
    if (validate) {
      const message = await validate(next)
      if (message) {
        setValidationMessage(message)
        return
      }
    }
    setValidationMessage(null)
    await onConfirm?.(next)
  }

  return {
    selection,
    setSelection,
    emitSelection,
    selectWithModifiers,
    confirmSelection
  }
}
