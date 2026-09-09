import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { emitMaximizedChanged } from '../capabilities/shell/register'
import { resolveAppIconPath } from './app-icon'
import { handleCloseRequest, markQuitting } from './tray'
import { applyTitleBarOverlay } from './title-bar-overlay'

export type MainWindowOptions = {
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
}

const defaults = {
  width: 960,
  height: 640,
  minWidth: 800,
  minHeight: 520
} as const

export function createMainWindow(options: MainWindowOptions = {}): BrowserWindow {
  const width = options.width ?? defaults.width
  const height = options.height ?? defaults.height
  const minWidth = options.minWidth ?? defaults.minWidth
  const minHeight = options.minHeight ?? defaults.minHeight

  const mainWindow = new BrowserWindow({
    width,
    height,
    minWidth,
    minHeight,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#18181b',
      symbolColor: '#fafafa',
      height: 30
    },
    ...(app.isPackaged ? {} : { icon: resolveAppIconPath() }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  applyTitleBarOverlay(mainWindow)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', (event) => {
    handleCloseRequest(mainWindow, event)
  })

  mainWindow.on('query-session-end', () => {
    markQuitting()
  })

  mainWindow.on('maximize', () => {
    emitMaximizedChanged(mainWindow, true)
  })

  mainWindow.on('unmaximize', () => {
    emitMaximizedChanged(mainWindow, false)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}
