import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import {
  FS_BROWSER_THIS_PC_PATH,
  type FsBrowserListDirectoryQuery,
  type FsBrowserListDirectoryResult,
  type FsBrowserListEntry
} from '@shared/capabilities/fs-browser'
import { err, ok, type Result } from '@shared/kernel/result'
import { getCachedDirectory, setCachedDirectory } from './directory-cache'
import { listVolumes } from './list-volumes'
import { entryExtension, isDotHidden, normalizeWinPath } from './path-guard'
import { listWindowsHiddenNames } from './windows-hidden'

function compareEntries(a: FsBrowserListEntry, b: FsBrowserListEntry): number {
  if (a.kind !== b.kind) {
    if (a.kind === 'directory') return -1
    if (b.kind === 'directory') return 1
    if (a.kind === 'volume') return -1
    if (b.kind === 'volume') return 1
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

/**
 * 单层目录列举。
 * `::this-pc` → 逻辑卷列表；其余走 readdir + Dirent + Hidden 属性。
 */
export async function listDirectory(
  query: FsBrowserListDirectoryQuery
): Promise<Result<FsBrowserListDirectoryResult>> {
  if (query.path === FS_BROWSER_THIS_PC_PATH) {
    const volumes = await listVolumes()
    if (!volumes.ok) return volumes
    return ok({ path: FS_BROWSER_THIS_PC_PATH, entries: volumes.value })
  }

  const path = normalizeWinPath(query.path)
  if (!path) {
    return err('FS_BROWSER_INVALID_PATH', '路径无效')
  }

  const showHidden = query.showHidden === true
  const showSystem = query.showSystem === true

  try {
    const dirStat = await stat(path)
    if (!dirStat.isDirectory()) {
      return err('FS_BROWSER_NOT_DIRECTORY', '目标不是目录')
    }

    const cached = getCachedDirectory(path, dirStat.mtimeMs)
    if (cached) {
      return ok({
        path,
        entries: filterEntries(cached, showHidden, showSystem)
      })
    }

    const [dirents, hiddenNames] = await Promise.all([
      readdir(path, { withFileTypes: true }),
      listWindowsHiddenNames(path)
    ])
    const entries: FsBrowserListEntry[] = []

    for (const dirent of dirents) {
      const name = dirent.name
      let kind: FsBrowserListEntry['kind']
      if (dirent.isDirectory()) kind = 'directory'
      else if (dirent.isFile() || dirent.isSymbolicLink()) kind = 'file'
      else continue

      entries.push({
        path: join(path, name),
        name,
        kind,
        extension: entryExtension(name, kind === 'directory'),
        isHidden: isDotHidden(name) || hiddenNames.has(name),
        isSystem: false
      })
    }

    entries.sort(compareEntries)
    setCachedDirectory(path, dirStat.mtimeMs, entries)

    return ok({
      path,
      entries: filterEntries(entries, showHidden, showSystem)
    })
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : ''
    if (code === 'EPERM' || code === 'EACCES') {
      return err('FS_BROWSER_ACCESS_DENIED', '没有权限打开此位置')
    }
    if (code === 'ENOENT') {
      return err('FS_BROWSER_NOT_FOUND', '位置不存在')
    }
    const message = error instanceof Error ? error.message : String(error)
    return err('FS_BROWSER_LIST_FAILED', message)
  }
}

function filterEntries(
  entries: FsBrowserListEntry[],
  showHidden: boolean,
  showSystem: boolean
): FsBrowserListEntry[] {
  return entries.filter((entry) => {
    if (!showHidden && entry.isHidden) return false
    if (!showSystem && entry.isSystem) return false
    return true
  })
}
