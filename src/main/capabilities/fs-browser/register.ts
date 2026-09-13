import { ipcMain } from 'electron'
import { fsBrowserIpc } from '@shared/capabilities/fs-browser'
import type { FsBrowserListDirectoryQuery } from '@shared/capabilities/fs-browser'
import { getEntryDetail } from './get-entry-detail'
import { getFileIconDataUrl } from './get-file-icon'
import { listDirectory } from './list-directory'
import { listRoots } from './list-roots'
import { listVolumes } from './list-volumes'
import { resolvePath } from './resolve-path'

export function registerFsBrowser(): void {
  ipcMain.handle(fsBrowserIpc.listRoots, () => listRoots())
  ipcMain.handle(fsBrowserIpc.listVolumes, () => listVolumes())

  ipcMain.handle(
    fsBrowserIpc.listDirectory,
    (_event, query: FsBrowserListDirectoryQuery) => listDirectory(query)
  )

  ipcMain.handle(fsBrowserIpc.getEntryDetail, (_event, path: string) =>
    getEntryDetail(path)
  )

  ipcMain.handle(fsBrowserIpc.resolvePath, (_event, path: string) =>
    resolvePath(path)
  )

  ipcMain.handle(fsBrowserIpc.getFileIcon, (_event, path: string) =>
    getFileIconDataUrl(path)
  )
}
