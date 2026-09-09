import { BrowserWindow, ipcMain } from 'electron'
import { ok } from '@shared/kernel/result'
import { shellIpc } from '@shared/capabilities/shell'

export function registerShell(): void {
  ipcMain.handle(shellIpc.isMaximized, (event) => {
    const maximized = BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
    return ok(maximized)
  })
}

export function emitMaximizedChanged(win: BrowserWindow, maximized: boolean): void {
  win.webContents.send(shellIpc.maximizedChanged, maximized)
}
