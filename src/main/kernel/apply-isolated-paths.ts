import { app, dialog } from 'electron'
import { t } from '@shared/i18n'
import { appFolderName, dataWritable, getDataRoot, isolatedPaths, packaged } from '../env'
import { loadPreferences } from '../capabilities/preferences/preferences-store'
import { appLog } from './app-log'

export function applyIsolatedPaths(): void {
  if (dataWritable) {
    app.setPath('appData', isolatedPaths.appData)
    app.setPath('userData', isolatedPaths.userData)
    app.setPath('sessionData', isolatedPaths.sessionData)
    app.setPath('temp', isolatedPaths.temp)
    app.setPath('logs', isolatedPaths.logs)
    app.setPath('crashDumps', isolatedPaths.crashDumps)
    app.commandLine.appendSwitch('disk-cache-dir', isolatedPaths.diskCache)
    app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
    appLog.info('paths', `isolated data root: ${getDataRoot()}`)
    return
  }

  // Install dir not writable: leave Electron defaults (%APPDATA%/koven) and
  // keep capability JSON under the same folder via getDataRoot().
  appLog.warn(
    'paths',
    `install data not writable; using system default under %APPDATA%\\${appFolderName}`
  )

  if (packaged) {
    const locale = loadPreferences().locale
    dialog.showErrorBox(
      t(locale, 'paths.dataNotWritableTitle'),
      t(locale, 'paths.dataNotWritableBody')
    )
  }
}
