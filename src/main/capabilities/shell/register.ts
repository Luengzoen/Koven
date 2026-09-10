import { BrowserWindow, ipcMain } from 'electron'
import { ok } from '@shared/kernel/result'
import { shellIpc, type ShellUiPatch } from '@shared/capabilities/shell'
import { loadShellSnapshot, patchShellUi } from './snapshot'

export function registerShell(): void {
  ipcMain.handle(shellIpc.isMaximized, (event) => {
    const maximized = BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
    return ok(maximized)
  })

  ipcMain.handle(shellIpc.getSnapshot, () => ok(loadShellSnapshot()))

  ipcMain.handle(shellIpc.patchUi, (_event, patch: unknown) => {
    if (!patch || typeof patch !== 'object') {
      return ok(loadShellSnapshot())
    }
    return ok(patchShellUi(patch as ShellUiPatch))
  })
}

export function emitMaximizedChanged(win: BrowserWindow, maximized: boolean): void {
  win.webContents.send(shellIpc.maximizedChanged, maximized)
}
