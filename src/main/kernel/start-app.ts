import { electronApp, optimizer } from '@electron-toolkit/utils'
import { app, Menu } from 'electron'
import { appLog } from './app-log'
import { applyIsolatedPaths } from './apply-isolated-paths'
import { createMainWindow } from './create-main-window'
import { registerAllIpc } from './register-ipc'
import { createTray, markQuitting } from './tray'
import { watchTitleBarOverlayTheme } from './title-bar-overlay'

export function startApp(): void {
  applyIsolatedPaths()
  Menu.setApplicationMenu(null)
  appLog.info('app', 'starting')

  void app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.koven.app')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    app.on('before-quit', () => {
      markQuitting()
    })

    registerAllIpc()
    watchTitleBarOverlayTheme()

    const mainWindow = createMainWindow()
    createTray(mainWindow)
    appLog.info('app', 'main window ready')
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
