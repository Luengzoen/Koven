import { app, BrowserWindow, Menu, Tray } from 'electron'
import { resolveAppIconPath } from './app-icon'

/** 已进入真正退出流程（before-quit / 系统关机）；窗口 close 不再拦截为隐藏 */
let quitting = false

let tray: Tray | null = null

export function markQuitting(): void {
  quitting = true
}

export function isQuitting(): boolean {
  return quitting
}

function showMainWindow(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

/** 托盘菜单「退出 Koven」：直接退出（暂无任务守卫） */
export function requestQuit(): void {
  app.quit()
}

/**
 * 点窗口关闭钮：默认隐藏到托盘，不算退出。
 * 真正退出流程（quitting）时放行 close。
 */
export function handleCloseRequest(win: BrowserWindow, event: Electron.Event): void {
  if (quitting) return
  event.preventDefault()
  win.hide()
}

export function createTray(win: BrowserWindow): void {
  tray = new Tray(resolveAppIconPath())
  tray.setToolTip('Koven')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '显示主窗口', enabled: false },
      { label: '设置', enabled: false },
      { type: 'separator' },
      { label: '退出 Koven', click: () => requestQuit() }
    ])
  )
  tray.on('click', () => showMainWindow(win))
}
