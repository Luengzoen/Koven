import type { MessageKey } from '@shared/i18n'
import type { FsBrowserListEntry, FsBrowserRootId } from '@shared/capabilities/fs-browser'

const ROOT_LABEL_KEY: Partial<Record<FsBrowserRootId, MessageKey>> = {
  documents: 'fsBrowser.rootDocuments',
  pictures: 'fsBrowser.rootPictures',
  downloads: 'fsBrowser.rootDownloads',
  desktop: 'fsBrowser.rootDesktop',
  'this-pc': 'fsBrowser.rootThisPc'
  // user：保留主进程给的用户名，不走词典
}

export function localizeRootEntry(
  entry: FsBrowserListEntry,
  t: (key: MessageKey) => string
): FsBrowserListEntry {
  if (!entry.rootId) return entry
  const key = ROOT_LABEL_KEY[entry.rootId]
  if (!key) return entry
  return { ...entry, name: t(key) }
}

export function localizeRootEntries(
  entries: FsBrowserListEntry[],
  t: (key: MessageKey) => string
): FsBrowserListEntry[] {
  return entries.map((entry) => localizeRootEntry(entry, t))
}
