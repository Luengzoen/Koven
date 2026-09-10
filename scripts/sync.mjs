/**
 * 从 vibe 同步到 master（对外干净板）并推送。
 * - 树 = vibe 最新提交，去掉 Agent 图谱/规则路径
 * - master 的 .gitignore 强制保留 vibe coding 忽略块
 * - 提交说明 = vibe 最新一次 commit message
 * - 自动 git push origin master
 *
 *   npm run sync
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const vibeBranch = 'vibe'
const masterBranch = 'master'
const indexFile = join(projectRoot, '.data', 'sync-git-index')
const excludePaths = ['AGENTS.md', 'knowledge-graph.md', 'knowledge', '.cursor/rules']

const vibeIgnoreBlock = [
  '',
  '# vibe coding',
  'AGENTS.md',
  'knowledge-graph.md',
  'knowledge/',
  '.cursor/rules/',
  ''
].join('\n')

function git(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
    env: options.env ?? process.env,
    input: options.input,
    stdio: options.stdio ?? ['pipe', 'pipe', 'pipe']
  })
  if (result.status !== 0) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join('\n').trim()
    const error = new Error(`git ${args.join(' ')} 失败${detail ? `\n${detail}` : ''}`)
    error.exitCode = result.status ?? 1
    throw error
  }
  return (result.stdout ?? '').trim()
}

function gitAllowFail(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
    env: options.env ?? process.env,
    input: options.input,
    stdio: ['pipe', 'pipe', 'pipe']
  })
  return {
    ok: result.status === 0,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim()
  }
}

function refExists(ref) {
  return gitAllowFail(['show-ref', '--verify', '--quiet', ref]).ok
}

function ensureVibeRef() {
  if (refExists(`refs/heads/${vibeBranch}`)) return vibeBranch
  if (refExists(`refs/remotes/origin/${vibeBranch}`)) return `origin/${vibeBranch}`
  throw new Error('找不到 vibe 分支（本地或 origin/vibe）。请先在 vibe 上开发并推送。')
}

function stripVibeIgnoreBlock(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.trim() === '# vibe coding') {
      i += 1
      while (i < lines.length) {
        const body = lines[i].trim()
        if (
          body === 'AGENTS.md' ||
          body === 'knowledge-graph.md' ||
          body === 'knowledge/' ||
          body === '.cursor/rules/' ||
          body === ''
        ) {
          i += 1
          continue
        }
        break
      }
      i -= 1
      continue
    }
    out.push(line)
  }
  while (out.length > 0 && out[out.length - 1] === '') out.pop()
  return `${out.join('\n')}\n`
}

function withMasterIgnore(gitignoreText) {
  const stripped = stripVibeIgnoreBlock(gitignoreText)
  return `${stripped.replace(/\n+$/, '\n')}${vibeIgnoreBlock}`
}

function indexEnv() {
  return { ...process.env, GIT_INDEX_FILE: indexFile }
}

function buildMasterTree(vibeRef) {
  mkdirSync(join(projectRoot, '.data'), { recursive: true })
  rmSync(indexFile, { force: true })

  const env = indexEnv()
  git(['read-tree', `${vibeRef}^{tree}`], { env })

  for (const relative of excludePaths) {
    gitAllowFail(['rm', '-r', '--cached', '-f', '--', relative], { env })
  }

  let gitignore = ''
  const shown = gitAllowFail(['show', `${vibeRef}:.gitignore`])
  if (shown.ok) {
    gitignore = shown.stdout
  }
  const masterGitignore = withMasterIgnore(gitignore || 'node_modules/\n')
  const blob = git(['hash-object', '-w', '--stdin'], { env, input: `${masterGitignore}` })
  git(['update-index', '--add', '--cacheinfo', `100644,${blob},.gitignore`], { env })

  return git(['write-tree'], { env })
}

function main() {
  if (!existsSync(join(projectRoot, '.git'))) {
    console.error('当前目录不是 git 仓库')
    process.exit(1)
  }
  if (!refExists(`refs/heads/${masterBranch}`)) {
    console.error('本地不存在 master 分支')
    process.exit(1)
  }

  const startBranch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
  const vibeRef = ensureVibeRef()
  console.log(`当前分支: ${startBranch}`)
  console.log(`源: ${vibeRef}`)

  const vibeCommit = git(['rev-parse', vibeRef])
  const message = git(['log', '-1', '--format=%B', vibeCommit]).replace(/\s+$/g, '\n')
  const authorName = git(['log', '-1', '--format=%an', vibeCommit])
  const authorEmail = git(['log', '-1', '--format=%ae', vibeCommit])
  const authorDate = git(['log', '-1', '--format=%aI', vibeCommit])

  console.log(`采用提交说明（vibe 最新）:\n${message.trimEnd()}\n`)

  try {
    const tree = buildMasterTree(vibeRef)
    const masterCommit = git(['rev-parse', masterBranch])
    const masterTree = git(['rev-parse', `${masterBranch}^{tree}`])

    if (tree === masterTree) {
      console.log('master 树已与 vibe（去图谱）一致，跳过提交')
    } else {
      const env = {
        ...process.env,
        GIT_AUTHOR_NAME: authorName,
        GIT_AUTHOR_EMAIL: authorEmail,
        GIT_AUTHOR_DATE: authorDate,
        GIT_COMMITTER_NAME: authorName,
        GIT_COMMITTER_EMAIL: authorEmail,
        GIT_COMMITTER_DATE: authorDate
      }
      const newCommit = git(['commit-tree', tree, '-p', masterCommit], {
        env,
        input: message.endsWith('\n') ? message : `${message}\n`
      })
      git(['update-ref', `refs/heads/${masterBranch}`, newCommit])
      console.log(`已更新本地 master → ${newCommit.slice(0, 7)}`)
    }

    console.log('推送 origin/master …')
    git(['push', 'origin', masterBranch], { stdio: ['ignore', 'inherit', 'inherit'] })
    console.log('sync 完成：master 已同步 vibe（已排除 Agent 图谱/规则）')
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = error instanceof Error && 'exitCode' in error ? Number(error.exitCode) || 1 : 1
  } finally {
    rmSync(indexFile, { force: true })
    writeFileSync(join(projectRoot, '.data', '.sync-keep'), '')
  }
}

main()
