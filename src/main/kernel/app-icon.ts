import { app } from 'electron'
import { join } from 'node:path'

/** 开发态与托盘：仓库内 build/koven.ico；打包后托盘读 extraResources 复制的 koven.ico */
export function resolveAppIconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'koven.ico')
    : join(__dirname, '../../build/koven.ico')
}
