import { app, dialog } from 'electron'
import { dataWritable, isolatedPaths, packaged } from '../env'

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
    return
  }

  if (packaged) {
    dialog.showErrorBox(
      '数据目录不可写',
      `程序安装目录没有写入权限，应用数据将保存到默认位置。\n建议安装到可写目录（如 D:\\Program Files\\Koven）。`
    )
  }
}
