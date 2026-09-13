import { ipcRenderer } from 'electron'
import {
  fsBrowserIpc,
  type FsBrowserAPI,
  type FsBrowserListDirectoryQuery
} from '@shared/capabilities/fs-browser'

export const fsBrowserApi: FsBrowserAPI = {
  fsBrowser: {
    listRoots: () => ipcRenderer.invoke(fsBrowserIpc.listRoots),
    listVolumes: () => ipcRenderer.invoke(fsBrowserIpc.listVolumes),
    listDirectory: (query: FsBrowserListDirectoryQuery) =>
      ipcRenderer.invoke(fsBrowserIpc.listDirectory, query),
    getEntryDetail: (path: string) =>
      ipcRenderer.invoke(fsBrowserIpc.getEntryDetail, path),
    resolvePath: (path: string) => ipcRenderer.invoke(fsBrowserIpc.resolvePath, path),
    getFileIcon: (path: string) => ipcRenderer.invoke(fsBrowserIpc.getFileIcon, path)
  }
}
