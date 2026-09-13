import { access, constants } from 'node:fs/promises'
import { userInfo } from 'node:os'
import { app } from 'electron'
import {
  FS_BROWSER_THIS_PC_PATH,
  type FsBrowserListEntry,
  type FsBrowserRootId
} from '@shared/capabilities/fs-browser'
import { err, ok, type Result } from '@shared/kernel/result'

type KnownFolder = {
  rootId: Exclude<FsBrowserRootId, 'this-pc' | 'user'>
  /** 占位名；渲染进程用 i18n 覆盖 */
  name: string
  /** Electron PathService / Known Folder，尊重用户重定向 */
  electronPath: 'documents' | 'pictures' | 'downloads' | 'desktop'
}

const KNOWN_FOLDERS: KnownFolder[] = [
  { rootId: 'documents', name: 'Documents', electronPath: 'documents' },
  { rootId: 'pictures', name: 'Pictures', electronPath: 'pictures' },
  { rootId: 'downloads', name: 'Downloads', electronPath: 'downloads' },
  { rootId: 'desktop', name: 'Desktop', electronPath: 'desktop' }
]

async function probePath(
  path: string,
  meta: Pick<FsBrowserListEntry, 'name' | 'rootId' | 'kind'>
): Promise<FsBrowserListEntry | null> {
  try {
    await access(path, constants.R_OK)
  } catch {
    return null
  }
  return {
    path,
    name: meta.name,
    kind: meta.kind,
    extension: '',
    isHidden: false,
    isSystem: false,
    rootId: meta.rootId
  }
}

async function probeKnownFolder(folder: KnownFolder): Promise<FsBrowserListEntry | null> {
  let path: string
  try {
    path = app.getPath(folder.electronPath)
  } catch {
    return null
  }
  return probePath(path, {
    name: folder.name,
    rootId: folder.rootId,
    kind: 'directory'
  })
}

async function probeUserHome(): Promise<FsBrowserListEntry | null> {
  let path: string
  try {
    path = app.getPath('home')
  } catch {
    return null
  }
  let username = 'User'
  try {
    username = userInfo().username || username
  } catch {
    // keep fallback
  }
  return probePath(path, {
    name: username,
    rootId: 'user',
    kind: 'directory'
  })
}

/** 根列：用户目录 / 文档 / 图片 / 下载 / 桌面 / 此电脑 */
export async function listRoots(): Promise<Result<FsBrowserListEntry[]>> {
  try {
    const [home, ...probed] = await Promise.all([
      probeUserHome(),
      ...KNOWN_FOLDERS.map(probeKnownFolder)
    ])
    const entries = [home, ...probed].filter(
      (entry): entry is FsBrowserListEntry => entry !== null
    )
    entries.push({
      path: FS_BROWSER_THIS_PC_PATH,
      name: 'This PC',
      kind: 'this-pc',
      extension: '',
      isHidden: false,
      isSystem: false,
      rootId: 'this-pc'
    })
    return ok(entries)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return err('FS_BROWSER_ROOTS_FAILED', message)
  }
}

export async function listKnownFolderRoots(): Promise<FsBrowserListEntry[]> {
  const result = await listRoots()
  if (!result.ok) return []
  return result.value.filter((entry) => entry.rootId && entry.rootId !== 'this-pc')
}
