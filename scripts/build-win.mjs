// Windows 打包入口：版本递增 + 进度渲染 + confine 隔离后打 NSIS
//   npm run build:win -- --increment patch|minor|major
//   npm run build:win -- --i patch
//   npm run build:win -- --version x.y.z
//   npm run build:win -- --dry-run
//   npm run build:win
import { createInterface } from 'node:readline'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = join(root, 'package.json')
const lockPath = join(root, 'package-lock.json')
const confineJs = join(root, 'scripts', 'confine.js')

const USAGE = `用法: npm run build:win -- [选项]

版本递增（自动更新 package.json / package-lock.json 后打包）:
  --increment, --i <patch|minor|major>   patch 末位+1 / minor 中位+1 尾归零 / major 首位+1 其余归零
  --version, --v <x.y.z>                 指定版本（必须大于当前版本）
  --dry-run                              只预览版本变化，不写文件不打包
  --help, -h                             显示本帮助

不传任何选项 = 原地打包（版本不变）。

示例:
  npm run build:win -- --increment patch
  npm run build:win -- --i minor
  npm run build:win -- --version 1.5.0
  npm run build:win`

const VALID_TYPES = ['patch', 'minor', 'major']
let dryRun = false

/** @param {string} message @returns {never} */
function fail(message) {
  console.error(`[build-win] ${message}`)
  process.exit(1)
}

/** @param {string[]} argv */
function parseArgs(argv) {
  let increment = null
  let targetVersion = null
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--increment' || arg === '--i') {
      const value = argv[++i]
      if (!VALID_TYPES.includes(value)) {
        fail(`--increment 取值须为 ${VALID_TYPES.join('/')}，收到: ${value}`)
      }
      increment = value
    } else if (arg === '--version' || arg === '--v') {
      targetVersion = argv[++i]
    } else if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE)
      process.exit(0)
    } else {
      fail(`未知参数: ${arg}（可用 --help 查看用法）`)
    }
  }
  if (increment && targetVersion) fail('--increment 与 --version 不能同时使用')
  return { increment, targetVersion }
}

/** @param {string} a @param {string} b */
function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na !== nb) return na - nb
  }
  return 0
}

/** @param {string} version @param {string} type */
function applyIncrement(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)
  switch (type) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'major':
      return `${major + 1}.0.0`
    default:
      fail(`未知递增类型: ${type}`)
  }
}

/** @param {string} file @param {string} oldVer @param {string} newVer @param {number} max */
function bumpJsonVersion(file, oldVer, newVer, max) {
  const content = readFileSync(file, 'utf8')
  const re = new RegExp(`"version":\\s*"${oldVer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')
  let count = 0
  const next = content.replace(re, (match) => {
    if (count >= max) return match
    count++
    return match.replace(oldVer, newVer)
  })
  if (count > 0) writeFileSync(file, next)
  return count
}

const SPINNER_CHARS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const STAGE_LABELS = {
  'building block map': '生成差分清单',
  'updating asar integrity': '更新 asar 完整性',
  'searching for node modules': '生成 ASAR',
  packaging: '打包应用',
  building: '构建安装器',
  copying: '复制文件',
  creating: '生成'
}

function resolveStageLabel(raw) {
  if (raw.includes('signing with signtool')) {
    const file = raw.match(/path=([^\s]+)/i)?.[1] ?? ''
    const base = file.split(/[\\/]/).pop() ?? ''
    const low = base.toLowerCase()
    if (low === 'elevate.exe') return `编辑提权助手资源（${base}）`
    if (low.includes('uninstaller')) return `编辑卸载器资源（${base}）`
    if (low.endsWith('setup.exe')) return `编辑安装器资源（${base}）`
    return `编辑主程序资源（${base || '主程序'}）`
  }
  const key = Object.keys(STAGE_LABELS)
    .sort((a, b) => b.length - a.length)
    .find((k) => raw.includes(k))
  return key ? STAGE_LABELS[key] : raw
}

const INFO_AS_STAGE_RE =
  /^•\s*(loaded configuration|skipped dependencies rebuild|using custom unpacked)/
const NOISE_LINE_RE =
  /^•?\s*(dependencies=\[|duplicate dependency references|collector stderr output)/
const isTty = process.stdout.isTTY === true
let stageNo = 0
let stageName = ''
let stageStart = 0
let spinFrame = 0
let filteredLines = 0
let pendingLines = []
let spinnerTimer = null

function fmtElapsed(ms) {
  return `${(ms / 1000).toFixed(3)}s`
}

function clipStageName() {
  return stageName.length > 48 ? `${stageName.slice(0, 48)}…` : stageName
}

function renderStageLine() {
  const elapsed = fmtElapsed(performance.now() - stageStart)
  const spin = SPINNER_CHARS[spinFrame++ % SPINNER_CHARS.length]
  process.stdout.write(`\r[阶段 ${stageNo}] ${spin} ${clipStageName()} ${elapsed}`)
}

function beginStage(name) {
  if (isTty) process.stdout.write('\r\x1b[2K')
  stageNo++
  stageName = name
  stageStart = performance.now()
  pendingLines = []
  if (spinnerTimer) {
    clearInterval(spinnerTimer)
    spinnerTimer = null
  }
  if (isTty) {
    spinnerTimer = setInterval(renderStageLine, 120)
    renderStageLine()
  } else {
    console.log(`[阶段 ${stageNo}] ${name}`)
  }
}

function finishStage() {
  if (spinnerTimer) {
    clearInterval(spinnerTimer)
    spinnerTimer = null
  }
  if (!stageName) return
  if (isTty) process.stdout.write('\r\x1b[2K')
  const elapsed = fmtElapsed(performance.now() - stageStart)
  const note = filteredLines > 0 ? `（过滤依赖列表输出 ${filteredLines} 行）` : ''
  console.log(`✓ ${clipStageName()} ${elapsed}${note}`)
  filteredLines = 0
}

function handleBuilderLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return
  if (NOISE_LINE_RE.test(trimmed)) {
    filteredLines++
    return
  }
  if (
    trimmed.startsWith('•') &&
    !/^•\s+electron-builder\b/.test(trimmed) &&
    !INFO_AS_STAGE_RE.test(trimmed)
  ) {
    finishStage()
    beginStage(resolveStageLabel(trimmed.replace(/^•\s+/, '')))
    return
  }
  if (/⨯|\berror\b|failed|warn|警告|错误/i.test(trimmed)) {
    if (isTty) process.stdout.write('\n')
    console.log(trimmed)
    return
  }
  pendingLines.push(trimmed)
  if (pendingLines.length > 200) pendingLines.shift()
}

function runWithProgress(cmd, args, name, extraEnv = {}) {
  return new Promise((resolve) => {
    beginStage(name)
    const child = spawn(cmd, args, {
      cwd: root,
      shell: process.platform === 'win32',
      env: { ...process.env, ...extraEnv }
    })
    for (const stream of [child.stdout, child.stderr]) {
      const rl = createInterface({ input: stream, crlfDelay: Infinity })
      rl.on('line', handleBuilderLine)
    }
    child.on('close', (code) => {
      finishStage()
      resolve(code ?? 1)
    })
  })
}

function exitWithReplay(code) {
  if (pendingLines.length > 0) {
    console.log('\n--- 最近输出回放（诊断用） ---')
    console.log(pendingLines.join('\n'))
  }
  process.exit(code)
}

const { increment, targetVersion } = parseArgs(process.argv.slice(2))
const currentVersion = JSON.parse(readFileSync(pkgPath, 'utf8')).version
if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) fail(`当前版本格式异常: ${currentVersion}`)

let nextVersion = currentVersion
let changed = false
if (increment) {
  nextVersion = applyIncrement(currentVersion, increment)
  changed = true
} else if (targetVersion) {
  if (!/^\d+\.\d+\.\d+$/.test(targetVersion)) {
    fail(`--version 须为 x.y.z 格式，收到: ${targetVersion}`)
  }
  if (compareVersions(targetVersion, currentVersion) <= 0) {
    fail(`指定版本 ${targetVersion} 必须大于当前版本 ${currentVersion}`)
  }
  nextVersion = targetVersion
  changed = true
}

console.log(`当前版本: v${currentVersion}`)
if (changed) {
  console.log(
    `目标版本: v${nextVersion}${increment ? `（${increment} +1）` : '（--version 指定）'}`
  )
} else {
  console.log('未指定版本参数，原地打包')
}

if (changed && !dryRun) {
  const pkgHits = bumpJsonVersion(pkgPath, currentVersion, nextVersion, 1)
  const lockHits = bumpJsonVersion(lockPath, currentVersion, nextVersion, 2)
  if (pkgHits < 1) fail(`package.json 未找到版本 ${currentVersion}，已中止（防止意外改动）`)
  if (lockHits < 2) {
    console.warn(
      `[build-win] 警告: package-lock.json 仅更新 ${lockHits}/2 处根版本，可运行 npm install 同步`
    )
  }
  console.log('已更新: package.json / package-lock.json')
} else if (changed && dryRun) {
  console.log('[dry-run] 未写文件（实际执行将更新 package.json / package-lock.json）')
}

if (dryRun) {
  console.log('[dry-run] 跳过打包')
  process.exit(0)
}

const buildStart = performance.now()
const typecheckCode = await runWithProgress('npm', ['run', 'check'], '质量检查')
if (typecheckCode !== 0) exitWithReplay(typecheckCode)

const viteCode = await runWithProgress(
  process.execPath,
  [confineJs, 'build'],
  '前端构建（vite）'
)
if (viteCode !== 0) exitWithReplay(viteCode)

const builderCode = await runWithProgress(
  process.execPath,
  [confineJs, 'pack'],
  '启动 electron-builder',
  { UV_THREADPOOL_SIZE: '16' }
)
if (builderCode !== 0) exitWithReplay(builderCode)

console.log(
  `[build-win] 完成: v${nextVersion}（总耗时 ${fmtElapsed(performance.now() - buildStart)}）`
)
