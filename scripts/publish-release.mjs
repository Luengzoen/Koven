// 将 dist/ 中最新的 NSIS 安装包上传到 GitHub Releases（不打包）
//   npm run publish
//   npm run publish -- --dry-run
import { execFileSync } from 'node:child_process'
import { createReadStream, readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { request as httpsRequest } from 'node:https'
import { dirname, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const SETUP_RE = /^koven-(\d+\.\d+\.\d+)-setup\.exe$/i
const API = 'https://api.github.com'

const USAGE = `用法: npm run publish -- [选项]

从 dist/ 按 mtime 选出最新的 koven-<version>-setup.exe，创建公开 GitHub Release 并上传。
不重新打包；请先 npm run build:win。

选项:
  --dry-run    只打印将上传的文件与目标 tag，不调 API
  --help, -h   显示本帮助

鉴权: 项目根目录 .env 的 GH_TOKEN，或环境变量 GH_TOKEN / GITHUB_TOKEN。
owner/repo 从 git remote origin 解析。`

const SPINNER_CHARS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const BAR_WIDTH = 20
const isTty = process.stdout.isTTY === true
let stageNo = 0
let stageName = ''
let stageStart = 0
let spinFrame = 0
let spinnerTimer = null
/** @type {{ sent: number, total: number } | null} */
let uploadProgress = null

/** 读取项目根 .env（不覆盖已有 process.env；无 dotenv 依赖） */
function loadDotEnv() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  const text = readFileSync(envPath, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadDotEnv()

function fmtElapsed(ms) {
  return `${(ms / 1000).toFixed(3)}s`
}

/** @param {number} bytes */
function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function clipStageName() {
  return stageName.length > 48 ? `${stageName.slice(0, 48)}…` : stageName
}

/** @param {number} pct 0–100 */
function renderBar(pct) {
  const filled = Math.min(BAR_WIDTH, Math.max(0, Math.round((pct / 100) * BAR_WIDTH)))
  return `${'█'.repeat(filled)}${'░'.repeat(BAR_WIDTH - filled)}`
}

function renderStageLine() {
  const elapsed = fmtElapsed(performance.now() - stageStart)
  if (uploadProgress && uploadProgress.total > 0) {
    const { sent, total } = uploadProgress
    const pct = Math.min(100, Math.floor((sent / total) * 100))
    process.stdout.write(
      `\r[阶段 ${stageNo}] ${renderBar(pct)} ${String(pct).padStart(3, ' ')}% ${fmtBytes(sent)}/${fmtBytes(total)} ${clipStageName()} ${elapsed}`
    )
    return
  }
  const spin = SPINNER_CHARS[spinFrame++ % SPINNER_CHARS.length]
  process.stdout.write(`\r[阶段 ${stageNo}] ${spin} ${clipStageName()} ${elapsed}`)
}

function beginStage(name) {
  if (isTty) process.stdout.write('\r\x1b[2K')
  stageNo++
  stageName = name
  stageStart = performance.now()
  uploadProgress = null
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
  if (uploadProgress && uploadProgress.total > 0) {
    console.log(
      `✓ ${clipStageName()} ${fmtBytes(uploadProgress.total)} ${elapsed}`
    )
  } else {
    console.log(`✓ ${clipStageName()} ${elapsed}`)
  }
  stageName = ''
  uploadProgress = null
}

/** @param {string} message @returns {never} */
function fail(message) {
  if (spinnerTimer) {
    clearInterval(spinnerTimer)
    spinnerTimer = null
  }
  if (isTty && stageName) process.stdout.write('\r\x1b[2K')
  console.error(`[publish] ${message}`)
  process.exit(1)
}

/** @param {string[]} argv */
function parseArgs(argv) {
  let dryRun = false
  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true
    else if (arg === '--help' || arg === '-h') {
      console.log(USAGE)
      process.exit(0)
    } else {
      fail(`未知参数: ${arg}（可用 --help 查看用法）`)
    }
  }
  return { dryRun }
}

function getToken() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  if (!token?.trim()) {
    fail(
      '缺少 GH_TOKEN（或 GITHUB_TOKEN）。请在项目根 .env 写入 GH_TOKEN=...，或在当前 shell 设置后重试。'
    )
  }
  return token.trim()
}

/** @returns {{ owner: string, repo: string }} */
function resolveRepo() {
  let url
  try {
    url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: root,
      encoding: 'utf8'
    }).trim()
  } catch {
    fail('无法读取 git remote origin，请确认在仓库根目录且已配置 origin。')
  }
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/i)
  if (!match) fail(`无法从 origin 解析 GitHub 仓库: ${url}`)
  return { owner: match[1], repo: match[2] }
}

/**
 * @returns {{
 *   version: string,
 *   exePath: string,
 *   exeName: string,
 *   exeBytes: number,
 *   blockmapPath: string | null,
 *   blockmapName: string | null,
 *   blockmapBytes: number | null,
 *   candidates: number
 * }}
 */
function pickLatestSetup() {
  if (!existsSync(distDir)) {
    fail('没有 dist/ 目录。请先运行 npm run build:win。')
  }
  /** @type {{ version: string, exePath: string, exeName: string, mtimeMs: number, size: number }[]} */
  const hits = []
  for (const name of readdirSync(distDir)) {
    const match = name.match(SETUP_RE)
    if (!match) continue
    const exePath = join(distDir, name)
    const st = statSync(exePath)
    if (!st.isFile()) continue
    hits.push({
      version: match[1],
      exePath,
      exeName: name,
      mtimeMs: st.mtimeMs,
      size: st.size
    })
  }
  if (hits.length === 0) {
    fail(
      'dist/ 中没有匹配 koven-<x.y.z>-setup.exe 的安装包。请先运行 npm run build:win。'
    )
  }
  hits.sort((a, b) => b.mtimeMs - a.mtimeMs)
  const top = hits[0]
  const blockmapName = `${top.exeName}.blockmap`
  const blockmapPath = join(distDir, blockmapName)
  const hasBlockmap = existsSync(blockmapPath)
  return {
    version: top.version,
    exePath: top.exePath,
    exeName: top.exeName,
    exeBytes: top.size,
    blockmapPath: hasBlockmap ? blockmapPath : null,
    blockmapName: hasBlockmap ? blockmapName : null,
    blockmapBytes: hasBlockmap ? statSync(blockmapPath).size : null,
    candidates: hits.length
  }
}

/** @param {string} token */
function authHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'koven-publish-release'
  }
}

/**
 * @param {string} method
 * @param {string} url
 * @param {string} token
 * @param {{ headers?: Record<string, string>, body?: string | Buffer }} [opts]
 */
async function githubJson(method, url, token, opts = {}) {
  const res = await fetch(url, {
    method,
    headers: { ...authHeaders(token), ...(opts.headers ?? {}) },
    body: opts.body
  })
  const text = await res.text()
  /** @type {Record<string, unknown> | null} */
  let json = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = { message: text.slice(0, 500) }
    }
  }
  if (!res.ok) {
    const msg =
      json && typeof json.message === 'string' ? json.message : res.statusText
    const err = /** @type {Error & { status?: number }} */ (
      new Error(`GitHub API ${method} → ${res.status}: ${msg}`)
    )
    err.status = res.status
    throw err
  }
  return json
}

/**
 * GitHub 上传 API 无进度回调；用本地已写入请求体的字节数画进度条。
 * @param {string} uploadUrlTemplate
 * @param {string} name
 * @param {string} filePath
 * @param {string} token
 */
async function uploadAsset(uploadUrlTemplate, name, filePath, token) {
  const cleaned = uploadUrlTemplate.replace(/\{\?[^}]+\}/, '')
  const url = new URL(`${cleaned}?name=${encodeURIComponent(name)}`)
  const total = statSync(filePath).size
  uploadProgress = { sent: 0, total }
  if (isTty) renderStageLine()

  const counter = new Transform({
    transform(chunk, _enc, cb) {
      if (uploadProgress) {
        uploadProgress.sent += chunk.length
      }
      if (isTty) renderStageLine()
      cb(null, chunk)
    }
  })

  await new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          ...authHeaders(token),
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(total)
        }
      },
      (res) => {
        /** @type {Buffer[]} */
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            if (uploadProgress) uploadProgress.sent = total
            resolve(undefined)
            return
          }
          let msg = res.statusMessage || 'upload failed'
          try {
            const j = JSON.parse(text)
            if (typeof j.message === 'string') msg = j.message
          } catch {
            if (text) msg = text.slice(0, 500)
          }
          reject(new Error(`上传 ${name} 失败 → ${res.statusCode}: ${msg}`))
        })
      }
    )
    req.on('error', reject)
    pipeline(createReadStream(filePath), counter, req).catch(reject)
  })
}

/**
 * @template T
 * @param {string} name
 * @param {() => Promise<T> | T} fn
 * @returns {Promise<T>}
 */
async function withStage(name, fn) {
  beginStage(name)
  try {
    const result = await fn()
    finishStage()
    return result
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err))
  }
}

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2))
  const publishStart = performance.now()

  const { owner, repo } = await withStage('解析 Git 远程仓库', () => resolveRepo())
  const artifact = await withStage('选择最新安装包', () => pickLatestSetup())
  const tag = `v${artifact.version}`

  console.log(`仓库: ${owner}/${repo}`)
  console.log(
    `选中: ${artifact.exeName}（${fmtBytes(artifact.exeBytes)}，mtime 最新；共 ${artifact.candidates} 个候选）`
  )
  console.log(`目标 Release: ${tag}（公开 / latest）`)
  if (artifact.blockmapName && artifact.blockmapBytes != null) {
    console.log(`附带: ${artifact.blockmapName}（${fmtBytes(artifact.blockmapBytes)}）`)
  } else {
    console.log('附带: （无 .blockmap）')
  }

  if (dryRun) {
    console.log('[dry-run] 跳过鉴权与上传')
    console.log(
      `[publish] dry-run 完成（总耗时 ${fmtElapsed(performance.now() - publishStart)}）`
    )
    return
  }

  const token = await withStage('读取 GH_TOKEN', () => getToken())

  await withStage(`检查 Release ${tag} 是否已存在`, async () => {
    const existing = await fetch(
      `${API}/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`,
      { headers: authHeaders(token) }
    )
    if (existing.status === 200) {
      throw new Error(
        `Release ${tag} 已存在。请删除该 Release/tag 或重新打包更高版本后再发。`
      )
    }
    if (existing.status !== 404) {
      const t = await existing.text()
      throw new Error(`检查已有 Release 失败 → ${existing.status}: ${t.slice(0, 300)}`)
    }
  })

  /** @type {{ html_url: string, upload_url: string }} */
  const release = await withStage(`创建公开 Release ${tag}`, async () => {
    try {
      return /** @type {{ html_url: string, upload_url: string }} */ (
        await githubJson('POST', `${API}/repos/${owner}/${repo}/releases`, token, {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tag_name: tag,
            name: tag,
            body: `Koven ${tag}`,
            draft: false,
            prerelease: false,
            make_latest: 'true'
          })
        })
      )
    } catch (err) {
      const e = /** @type {Error & { status?: number }} */ (err)
      if (e.status === 422) {
        throw new Error(`无法创建 ${tag}（可能 tag 已存在）: ${e.message}`)
      }
      throw e
    }
  })

  console.log(`Release URL: ${release.html_url}`)

  await withStage(
    `上传安装包 ${artifact.exeName}（${fmtBytes(artifact.exeBytes)}）`,
    () => uploadAsset(release.upload_url, artifact.exeName, artifact.exePath, token)
  )

  if (artifact.blockmapPath && artifact.blockmapName && artifact.blockmapBytes != null) {
    await withStage(
      `上传差分清单 ${artifact.blockmapName}（${fmtBytes(artifact.blockmapBytes)}）`,
      () =>
        uploadAsset(
          release.upload_url,
          artifact.blockmapName,
          artifact.blockmapPath,
          token
        )
    )
  }

  console.log(
    `[publish] 完成: ${release.html_url}（总耗时 ${fmtElapsed(performance.now() - publishStart)}）`
  )
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err))
})
