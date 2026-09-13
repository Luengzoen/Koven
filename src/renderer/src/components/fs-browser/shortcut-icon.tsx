import { isShortcutEntry } from '@renderer/components/fs-browser/display-name'
import type { FsBrowserListEntry } from '@shared/capabilities/fs-browser'
import { FileIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const memoryCache = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()

async function loadShortcutIcon(path: string): Promise<string | null> {
  const key = path.toLowerCase()
  if (memoryCache.has(key)) return memoryCache.get(key) ?? null

  const pending = inflight.get(key)
  if (pending) return pending

  const task = (async () => {
    const result = await window.koven.fsBrowser.getFileIcon(path)
    const dataUrl = result.ok ? result.value : null
    memoryCache.set(key, dataUrl)
    inflight.delete(key)
    return dataUrl
  })()

  inflight.set(key, task)
  return task
}

type ShortcutIconProps = {
  entry: FsBrowserListEntry
  className?: string
}

/** .lnk：拉取系统壳图标；失败回退通用文件图标 */
export function ShortcutIcon({
  entry,
  className = 'size-3.5 shrink-0'
}: ShortcutIconProps) {
  const cacheKey = entry.path.toLowerCase()
  const [dataUrl, setDataUrl] = useState<string | null | undefined>(() =>
    memoryCache.has(cacheKey) ? (memoryCache.get(cacheKey) ?? null) : undefined
  )

  useEffect(() => {
    if (!isShortcutEntry(entry)) return
    let cancelled = false
    if (memoryCache.has(cacheKey)) {
      setDataUrl(memoryCache.get(cacheKey) ?? null)
      return
    }
    setDataUrl(undefined)
    void loadShortcutIcon(entry.path).then((url) => {
      if (!cancelled) setDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [entry, cacheKey])

  if (typeof dataUrl === 'string') {
    return (
      <img
        src={dataUrl}
        alt=""
        draggable={false}
        className={className}
        aria-hidden
      />
    )
  }

  return (
    <FileIcon
      className={`${className}${dataUrl === undefined ? ' opacity-40' : ''}`}
      aria-hidden
    />
  )
}
