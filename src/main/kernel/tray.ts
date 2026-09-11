import { app, BrowserWindow, Menu, Tray } from 'electron'
import { loadPreferences } from '../capabilities/preferences/preferences-store'
import { t } from '@shared/i18n'
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
 * 点窗口关闭钮：按偏好隐藏到托盘或真正退出。
 * 真正退出流程（quitting）时放行 close。
 */
export function handleCloseRequest(win: BrowserWindow, event: Electron.Event): void {
  if (quitting) return

  const { closeBehavior } = loadPreferences().general
  if (closeBehavior === 'quit') {
    markQuitting()
    return
  }

  event.preventDefault()
  win.hide()
}

function buildTrayMenu(): Menu {
  const locale = loadPreferences().locale
  return Menu.buildFromTemplate([
    { label: t(locale, 'tray.showMainWindow'), enabled: false },
    { label: t(locale, 'tray.settings'), enabled: false },
    { type: 'separator' },
    { label: t(locale, 'tray.quit'), click: () => requestQuit() }
  ])
}

/** 语言切换后重建托盘菜单文案 */
export function refreshTrayMenu(): void {
  if (!tray) return
  tray.setContextMenu(buildTrayMenu())
}

export function createTray(win: BrowserWindow): void {
  tray = new Tray(resolveAppIconPath())
  tray.setToolTip('Koven')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', () => showMainWindow(win))
}
