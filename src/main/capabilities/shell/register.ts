import { BrowserWindow, ipcMain } from 'electron'
import { ok } from '@shared/kernel/result'
import { shellIpc, type ShellUiPatch } from '@shared/capabilities/shell'
import { loadShellSnapshot, patchShellUi } from './snapshot'

let uiReadyListener: (() => void) | null = null
let uiReadyReceived = false

/** 启动交接订阅；若 uiReady 已先到则立刻回调一次 */
export function onShellUiReady(listener: () => void): void {
  if (uiReadyReceived) {
    listener()
    return
  }
  uiReadyListener = listener
}

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

  ipcMain.on(shellIpc.uiReady, () => {
    if (uiReadyReceived) return
    uiReadyReceived = true
    const listener = uiReadyListener
    uiReadyListener = null
    listener?.()
  })
}

export function emitMaximizedChanged(win: BrowserWindow, maximized: boolean): void {
  win.webContents.send(shellIpc.maximizedChanged, maximized)
}
