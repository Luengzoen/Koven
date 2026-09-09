const { execSync, spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const electronCache = path.join(projectRoot, '.electron-cache')
const electronBuilderCache = path.join(projectRoot, '.electron-builder-cache')
const npmCache = path.join(projectRoot, '.npm-cache')
const temp = path.join(projectRoot, '.data', 'temp')
const appData = path.join(projectRoot, '.data', 'appData')
const localAppData = path.join(projectRoot, '.data', 'localAppData')

for (const dir of [
  electronCache,
  electronBuilderCache,
  npmCache,
  temp,
  appData,
  localAppData
]) {
  fs.mkdirSync(dir, { recursive: true })
}

if (process.platform === 'win32') {
  try {
    execSync('chcp 65001 >nul', { stdio: 'ignore', shell: true })
  } catch {
    // 控制台代码页切 UTF-8 失败时继续，避免挡住启动
  }
}

process.env.electron_config_cache = electronCache
process.env.ELECTRON_CACHE = electronCache
process.env.ELECTRON_BUILDER_CACHE = electronBuilderCache
process.env.ELECTRON_BUILDER_BINARIES_MIRROR =
  process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||
  'https://npmmirror.com/mirrors/electron-builder-binaries/'
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'
process.env.npm_config_cache = npmCache
process.env.APPDATA = appData
process.env.LOCALAPPDATA = localAppData
process.env.TMP = temp
process.env.TEMP = temp
process.env.TMPDIR = temp
process.env.ELECTRON_MIRROR =
  process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/'

const action = process.argv[2]
const electronVite = path.join(
  projectRoot,
  'node_modules',
  'electron-vite',
  'bin',
  'electron-vite.js'
)
const electronInstall = path.join(
  projectRoot,
  'node_modules',
  'electron',
  'install.js'
)
const electronBuilder = path.join(
  projectRoot,
  'node_modules',
  'electron-builder',
  'cli.js'
)

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
      windowsHide: false
    })

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`terminated by ${signal}`))
        return
      }
      if (code) {
        reject(new Error(`exit ${code}`))
        return
      }
      resolve()
    })
  })
}

async function main() {
  if (action === 'install') {
    await runNode([electronInstall])
    return
  }
  if (action === 'dev') {
    await runNode([electronVite, 'dev'])
    return
  }
  if (action === 'preview') {
    await runNode([electronVite, 'preview'])
    return
  }
  if (action === 'build') {
    await runNode([electronVite, 'build'])
    return
  }
  if (action === 'pack') {
    await runNode([electronBuilder, '--win', '--x64', '--publish', 'never'])
    return
  }
  if (action === 'unpack') {
    await runNode([electronVite, 'build'])
    await runNode([
      electronBuilder,
      '--dir',
      '--win',
      '--x64',
      '--publish',
      'never'
    ])
    return
  }
  if (action === 'build:win') {
    await runNode([electronVite, 'build'])
    await runNode([electronBuilder, '--win', '--x64', '--publish', 'never'])
    return
  }

  console.error(
    'Usage: node scripts/confine.js <install|dev|preview|build|pack|unpack|build:win>'
  )
  process.exit(1)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
