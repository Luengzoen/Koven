import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, nativeTheme, shell } from 'electron'
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
import { loadPreferences } from '../capabilities/preferences/preferences-store'
import { resolveAppIconPath } from './app-icon'
import { handleCloseRequest, markQuitting } from './tray'
import { applyTitleBarOverlay } from './title-bar-overlay'

function resolveMainBackgroundColor(): string {
  const theme = loadPreferences().theme
  const dark =
    theme === 'dark' || (theme === 'system' && nativeTheme.shouldUseDarkColors)
  return dark ? '#09090b' : '#fafafa'
}

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
    backgroundColor: resolveMainBackgroundColor(),
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f4f4f5',
      symbolColor: '#18181b',
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

  // 显式 show 由 startup-handoff 在 Splash 关电视交接时触发

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
