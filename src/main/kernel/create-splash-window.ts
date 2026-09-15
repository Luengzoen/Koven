import { is } from '@electron-toolkit/utils'
import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { trackSplashWindow } from './splash-windows'

/** 透明无边框启动 Splash：镂空背景 + 居中品牌字 */
export function createSplashWindow(): BrowserWindow {
  const display = screen.getPrimaryDisplay()
  const { x, y, width, height } = display.workArea

  const splash = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    focusable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  trackSplashWindow(splash)

  splash.once('ready-to-show', () => {
    if (!splash.isDestroyed()) {
      splash.showInactive()
    }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void splash.loadURL(`${process.env.ELECTRON_RENDERER_URL}/splash.html`)
  } else {
    void splash.loadFile(join(__dirname, '../renderer/splash.html'))
  }

  return splash
}
