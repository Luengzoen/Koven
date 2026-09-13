import { readdir, stat, statfs } from 'node:fs/promises'
import { basename } from 'node:path'
import {
  FS_BROWSER_THIS_PC_PATH,
  type FsBrowserEntryDetail
} from '@shared/capabilities/fs-browser'
import { err, ok, type Result } from '@shared/kernel/result'
import { entryExtension, isDotHidden, normalizeWinPath } from './path-guard'

function isVolumeRoot(path: string): boolean {
  return /^[A-Za-z]:\\$/.test(path)
}

export async function getEntryDetail(
  inputPath: string
): Promise<Result<FsBrowserEntryDetail>> {
  if (inputPath === FS_BROWSER_THIS_PC_PATH) {
    return ok({
      path: FS_BROWSER_THIS_PC_PATH,
      name: 'This PC',
      kind: 'this-pc',
      extension: '',
      sizeBytes: null,
      modifiedAt: null,
      createdAt: null,
      accessedAt: null,
      isHidden: false,
      isSystem: false,
      isReadonly: true,
      volumeLabel: null,
      freeBytes: null,
      totalBytes: null,
      childCount: null,
      rootId: 'this-pc'
    })
  }

  const path = normalizeWinPath(inputPath)
  if (!path) {
    return err('FS_BROWSER_INVALID_PATH', '路径无效')
  }

  try {
    if (isVolumeRoot(path)) {
      let freeBytes: number | null = null
      let totalBytes: number | null = null
      try {
        const fsStat = await statfs(path)
        freeBytes = Number(fsStat.bavail) * Number(fsStat.bsize)
        totalBytes = Number(fsStat.blocks) * Number(fsStat.bsize)
      } catch {
        // ignore
      }

      const letter = path.slice(0, 1).toUpperCase()
      return ok({
        path,
        name: `${letter}:`,
        kind: 'volume',
        extension: '',
        sizeBytes: null,
        modifiedAt: null,
        createdAt: null,
        accessedAt: null,
        isHidden: false,
        isSystem: false,
        isReadonly: false,
        volumeLabel: null,
        freeBytes,
        totalBytes,
        childCount: null
      })
    }

    const info = await stat(path)
    const isDirectory = info.isDirectory()
    const name = basename(path)
    let childCount: number | null = null
    if (isDirectory) {
      try {
        const children = await readdir(path)
        childCount = children.length
      } catch {
        childCount = null
      }
    }

    return ok({
      path,
      name,
      kind: isDirectory ? 'directory' : 'file',
      extension: entryExtension(name, isDirectory),
      sizeBytes: isDirectory ? null : info.size,
      modifiedAt: info.mtimeMs,
      createdAt: info.birthtimeMs,
      accessedAt: info.atimeMs,
      isHidden: isDotHidden(name),
      isSystem: false,
      isReadonly: (info.mode & 0o200) === 0,
      volumeLabel: null,
      freeBytes: null,
      totalBytes: null,
      childCount
    })
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : ''
    if (code === 'EPERM' || code === 'EACCES') {
      return err('FS_BROWSER_ACCESS_DENIED', '没有权限查看详情')
    }
    if (code === 'ENOENT') {
      return err('FS_BROWSER_NOT_FOUND', '项目不存在')
    }
    const message = error instanceof Error ? error.message : String(error)
    return err('FS_BROWSER_DETAIL_FAILED', message)
  }
}
