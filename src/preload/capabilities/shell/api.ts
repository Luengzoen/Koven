import { ipcRenderer } from 'electron'
import { shellIpc, type ShellAPI, type ShellUiPatch } from '@shared/capabilities/shell'

export const shellApi: ShellAPI = {
  shell: {
    isMaximized: () => ipcRenderer.invoke(shellIpc.isMaximized),
    onMaximizedChange: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, maximized: boolean): void => {
        callback(maximized)
      }
      ipcRenderer.on(shellIpc.maximizedChanged, listener)
      return () => {
        ipcRenderer.removeListener(shellIpc.maximizedChanged, listener)
      }
    },
    getSnapshot: () => ipcRenderer.invoke(shellIpc.getSnapshot),
    patchUi: (patch: ShellUiPatch) => ipcRenderer.invoke(shellIpc.patchUi, patch),
    notifyUiReady: () => {
      ipcRenderer.send(shellIpc.uiReady)
    }
  }
}
