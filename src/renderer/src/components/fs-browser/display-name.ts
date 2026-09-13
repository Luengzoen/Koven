import type { FsBrowserListEntry } from '@shared/capabilities/fs-browser'

/** 列表/详情展示名：隐藏 .lnk 后缀 */
export function displayEntryName(entry: Pick<FsBrowserListEntry, 'name' | 'extension'>): string {
  if (entry.extension === 'lnk') {
    const lower = entry.name.toLowerCase()
    if (lower.endsWith('.lnk')) return entry.name.slice(0, -4)
  }
  return entry.name
}

export function isShortcutEntry(entry: Pick<FsBrowserListEntry, 'kind' | 'extension'>): boolean {
  return entry.kind === 'file' && entry.extension === 'lnk'
}
