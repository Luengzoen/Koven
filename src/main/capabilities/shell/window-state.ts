import { BrowserWindow } from 'electron'
import { saveShellWindowState } from './snapshot'

export function captureWindowState(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  const maximized = win.isMaximized()
  const bounds = maximized ? win.getNormalBounds() : win.getBounds()
  saveShellWindowState({ bounds, maximized })
}

export function bindWindowStatePersistence(win: BrowserWindow): void {
  let timer: ReturnType<typeof setTimeout> | null = null

  const schedule = (): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      captureWindowState(win)
    }, 300)
  }

  win.on('resize', schedule)
  win.on('move', schedule)
  win.on('maximize', schedule)
  win.on('unmaximize', schedule)
  win.on('close', () => {
    if (timer) clearTimeout(timer)
    captureWindowState(win)
  })
}
