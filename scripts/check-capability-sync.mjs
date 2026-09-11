import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')

function read(relPath) {
  return readFileSync(join(projectRoot, relPath), 'utf8')
}

function listCapabilityDirs(relDir) {
  const abs = join(projectRoot, relDir)
  if (!existsSync(abs)) return []
  return readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function fail(message) {
  console.error(`capability-sync: ${message}`)
  process.exitCode = 1
}

const sharedCaps = readdirSync(join(projectRoot, 'src/shared/capabilities'))
  .filter((name) => name.endsWith('.ts'))
  .map((name) => name.replace(/\.ts$/, ''))
  .sort()

const mainCaps = listCapabilityDirs('src/main/capabilities')
const preloadCaps = listCapabilityDirs('src/preload/capabilities')

const registerIpc = read('src/main/kernel/register-ipc.ts')
const preloadIndex = read('src/preload/index.ts')
const appApi = read('src/shared/app-api.ts')

/** Caps that ship full IPC (shared + main register + preload api). */
const ipcCaps = sharedCaps.filter((name) => {
  const hasMain = mainCaps.includes(name) && existsSync(join(projectRoot, `src/main/capabilities/${name}/register.ts`))
  const hasPreload = preloadCaps.includes(name) && existsSync(join(projectRoot, `src/preload/capabilities/${name}/api.ts`))
  return hasMain || hasPreload
})

for (const name of ipcCaps) {
  const pascal = name
    .split('-')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join('')
  const camel = name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())

  if (!sharedCaps.includes(name)) {
    fail(`missing shared contract: src/shared/capabilities/${name}.ts`)
  }

  if (!existsSync(join(projectRoot, `src/main/capabilities/${name}/register.ts`))) {
    fail(`missing main register: src/main/capabilities/${name}/register.ts`)
  }

  if (!existsSync(join(projectRoot, `src/preload/capabilities/${name}/api.ts`))) {
    fail(`missing preload api: src/preload/capabilities/${name}/api.ts`)
  }

  if (!registerIpc.includes(`register${pascal}`)) {
    fail(`register-ipc.ts must call register${pascal}()`)
  }

  if (!preloadIndex.includes(`${camel}Api`)) {
    fail(`preload/index.ts must spread ${camel}Api`)
  }

  if (!appApi.includes(`${pascal}API`)) {
    fail(`app-api.ts must include ${pascal}API in AppAPI`)
  }
}

/** Main has register but shared/preload incomplete */
for (const name of mainCaps) {
  if (!existsSync(join(projectRoot, `src/main/capabilities/${name}/register.ts`))) {
    continue
  }
  if (!sharedCaps.includes(name) || !preloadCaps.includes(name)) {
    fail(
      `main capability "${name}" has register.ts but missing matching shared and/or preload package`
    )
  }
}

for (const name of preloadCaps) {
  if (!existsSync(join(projectRoot, `src/preload/capabilities/${name}/api.ts`))) {
    continue
  }
  if (!sharedCaps.includes(name) || !mainCaps.includes(name)) {
    fail(
      `preload capability "${name}" has api.ts but missing matching shared and/or main package`
    )
  }
}

if (process.exitCode) {
  console.error('capability-sync: failed')
  process.exit(process.exitCode)
}

console.log(`capability-sync: ok (${ipcCaps.join(', ') || 'none'})`)
