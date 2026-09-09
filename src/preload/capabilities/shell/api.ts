import { ipcRenderer } from 'electron'
import { shellIpc, type ShellAPI } from '@shared/capabilities/shell'

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
    }
  }
}
