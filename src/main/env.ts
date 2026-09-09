import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

if (process.platform !== 'win32') {
  console.error('This app supports Windows only.')
  process.exit(1)
}

export const packaged = __dirname.includes('app.asar')

export const projectRoot = packaged
  ? dirname(process.execPath)
  : join(__dirname, '../..')

export const dataRoot = join(projectRoot, '.data')

export const isolatedPaths = {
  appData: join(dataRoot, 'appData'),
  localAppData: join(dataRoot, 'localAppData'),
  userData: join(dataRoot, 'userData'),
  sessionData: join(dataRoot, 'sessionData'),
  temp: join(dataRoot, 'temp'),
  logs: join(dataRoot, 'logs'),
  crashDumps: join(dataRoot, 'crashDumps'),
  diskCache: join(dataRoot, 'disk-cache')
} as const

export function isWritable(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true })
    const probe = join(dir, '.write-probe')
    writeFileSync(probe, 'ok')
    rmSync(probe)
    return true
  } catch {
    return false
  }
}

export const dataWritable = isWritable(dataRoot)

if (dataWritable) {
  for (const dir of Object.values(isolatedPaths)) {
    mkdirSync(dir, { recursive: true })
  }

  process.env.APPDATA = isolatedPaths.appData
  process.env.LOCALAPPDATA = isolatedPaths.localAppData
  process.env.TMP = isolatedPaths.temp
  process.env.TEMP = isolatedPaths.temp
  process.env.TMPDIR = isolatedPaths.temp
}
