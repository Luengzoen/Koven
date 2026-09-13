import type { FsBrowserListEntry } from '@shared/capabilities/fs-browser'

type CacheRecord = {
  entries: FsBrowserListEntry[]
  /** 目录自身 mtime；变化则失效 */
  dirMtimeMs: number
  fetchedAt: number
}

const MAX_ENTRIES = 256
const TTL_MS = 30_000

const cache = new Map<string, CacheRecord>()

function touch(key: string, record: CacheRecord): void {
  cache.delete(key)
  cache.set(key, record)
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

export function getCachedDirectory(
  pathKey: string,
  dirMtimeMs: number
): FsBrowserListEntry[] | null {
  const key = pathKey.toLowerCase()
  const hit = cache.get(key)
  if (!hit) return null
  if (hit.dirMtimeMs !== dirMtimeMs) {
    cache.delete(key)
    return null
  }
  if (Date.now() - hit.fetchedAt > TTL_MS) {
    cache.delete(key)
    return null
  }
  touch(key, hit)
  return hit.entries
}

export function setCachedDirectory(
  pathKey: string,
  dirMtimeMs: number,
  entries: FsBrowserListEntry[]
): void {
  touch(pathKey.toLowerCase(), {
    entries,
    dirMtimeMs,
    fetchedAt: Date.now()
  })
}

export function invalidateDirectoryCache(pathKey?: string): void {
  if (!pathKey) {
    cache.clear()
    return
  }
  cache.delete(pathKey.toLowerCase())
}
