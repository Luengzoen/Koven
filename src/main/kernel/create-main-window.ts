import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { emitMaximizedChanged } from '../capabilities/shell/register'
import {
  centeredWindowBounds,
  defaultWindowBounds,
  isBoundsOnScreen,
  tryLoadShellSnapshot,
  createDefaultShellSnapshot
} from '../capabilities/shell/snapshot'
import { bindWindowStatePersistence } from '../capabilities/shell/window-state'
import { resolveAppIconPath } from './app-icon'
import { handleCloseRequest, markQuitting } from './tray'
import { applyTitleBarOverlay } from './title-bar-overlay'

export type MainWindowOptions = {
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
}

export function createMainWindow(options: MainWindowOptions = {}): BrowserWindow {
  const fromDisk = tryLoadShellSnapshot()
  const snapshot = fromDisk ?? createDefaultShellSnapshot()
  const saved = snapshot.window
  const minWidth = options.minWidth ?? defaultWindowBounds.minWidth
  const minHeight = options.minHeight ?? defaultWindowBounds.minHeight

  let width = options.width ?? saved.bounds.width
  let height = options.height ?? saved.bounds.height
  let x: number | undefined = saved.bounds.x
  let y: number | undefined = saved.bounds.y
  let restoreMaximized = false

  const usable =
    fromDisk !== null &&
    width >= minWidth &&
    height >= minHeight &&
    isBoundsOnScreen({ x: x ?? 0, y: y ?? 0, width, height })

  if (usable) {
    restoreMaximized = saved.maximized
  } else {
    width = options.width ?? defaultWindowBounds.width
    height = options.height ?? defaultWindowBounds.height
    const centered = centeredWindowBounds(width, height)
    x = centered.x
    y = centered.y
  }

  const mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
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
  bindWindowStatePersistence(mainWindow)

  if (restoreMaximized) {
    mainWindow.maximize()
  }

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
