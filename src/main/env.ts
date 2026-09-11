import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

if (process.platform !== 'win32') {
  console.error('This app supports Windows only.')
  process.exit(1)
}

/** Matches package.json `name` / Electron default userData folder. */
export const appFolderName = 'koven'

export const packaged = __dirname.includes('app.asar')

export const projectRoot = packaged
  ? dirname(process.execPath)
  : join(__dirname, '../..')

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

function resolveSystemAppData(): string {
  if (process.env.APPDATA && process.env.APPDATA.length > 0) {
    return process.env.APPDATA
  }
  return join(homedir(), 'AppData', 'Roaming')
}

const projectDataRoot = join(projectRoot, '.data')

/** True when install/project `.data` can hold runtime files. */
export const dataWritable = isWritable(projectDataRoot)

/**
 * Capability JSON + app logs root.
 * Writable install → `<project|install>/.data`.
 * Otherwise → `%APPDATA%/koven` (same as Electron default userData).
 */
let activeDataRoot = dataWritable
  ? projectDataRoot
  : join(resolveSystemAppData(), appFolderName)

export function getDataRoot(): string {
  return activeDataRoot
}

export function setDataRootForTests(root: string): void {
  activeDataRoot = root
}

export function resetDataRootAfterTests(): void {
  activeDataRoot = dataWritable
    ? projectDataRoot
    : join(resolveSystemAppData(), appFolderName)
}

function buildIsolatedPaths(root: string) {
  return {
    appData: join(root, 'appData'),
    localAppData: join(root, 'localAppData'),
    userData: join(root, 'userData'),
    sessionData: join(root, 'sessionData'),
    temp: join(root, 'temp'),
    logs: join(root, 'logs'),
    crashDumps: join(root, 'crashDumps'),
    diskCache: join(root, 'disk-cache')
  } as const
}

export const isolatedPaths = buildIsolatedPaths(projectDataRoot)

/** Logs always under active data root (isolated or system fallback). */
export function getLogsRoot(): string {
  return dataWritable ? isolatedPaths.logs : join(getDataRoot(), 'logs')
}

if (dataWritable) {
  for (const dir of Object.values(isolatedPaths)) {
    mkdirSync(dir, { recursive: true })
  }

  process.env.APPDATA = isolatedPaths.appData
  process.env.LOCALAPPDATA = isolatedPaths.localAppData
  process.env.TMP = isolatedPaths.temp
  process.env.TEMP = isolatedPaths.temp
  process.env.TMPDIR = isolatedPaths.temp
} else {
  mkdirSync(getDataRoot(), { recursive: true })
  mkdirSync(getLogsRoot(), { recursive: true })
  mkdirSync(join(getDataRoot(), 'capabilities'), { recursive: true })
}
