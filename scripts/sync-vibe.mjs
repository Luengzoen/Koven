/**
 * 将本机 Agent 图谱/规则同步到 vibe 分支并推送。
 * master 仍忽略这些路径；vibe 跟踪它们。
 *
 *   npm run sync:vibe
 */
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const vibeBranch = 'vibe'
const commitMessage = 'chore: 同步 Agent 图谱与规则'
const stagingRoot = join(projectRoot, '.data', 'vibe-sync-staging')

const syncPaths = ['AGENTS.md', 'knowledge-graph.md', 'knowledge', '.cursor/rules']

function git(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe']
  })
  if (result.status !== 0) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join('\n').trim()
    const error = new Error(`git ${args.join(' ')} 失败${detail ? `\n${detail}` : ''}`)
    error.exitCode = result.status ?? 1
    throw error
  }
  return (result.stdout ?? '').trim()
}

function gitAllowFail(args) {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  return result.status === 0
}

function refExists(ref) {
  return gitAllowFail(['show-ref', '--verify', '--quiet', ref])
}

function copyTree(from, to) {
  rmSync(to, { recursive: true, force: true })
  mkdirSync(to, { recursive: true })
  for (const relative of syncPaths) {
    const source = join(from, relative)
    if (!existsSync(source)) {
      console.warn(`跳过（不存在）: ${relative}`)
      continue
    }
    cpSync(source, join(to, relative), { recursive: true })
  }
}

function restoreStagingIntoProject() {
  for (const relative of syncPaths) {
    const source = join(stagingRoot, relative)
    if (!existsSync(source)) continue
    const target = join(projectRoot, relative)
    rmSync(target, { recursive: true, force: true })
    cpSync(source, target, { recursive: true })
  }
}

function ensureVibeBranch() {
  if (refExists(`refs/heads/${vibeBranch}`)) {
    return
  }
  if (refExists(`refs/remotes/origin/${vibeBranch}`)) {
    git(['branch', '--track', vibeBranch, `origin/${vibeBranch}`])
    console.log(`已创建本地跟踪分支 ${vibeBranch} ← origin/${vibeBranch}`)
    return
  }
  git(['branch', vibeBranch, 'master'])
  console.log(`已从 master 创建分支 ${vibeBranch}`)
}

function main() {
  if (!existsSync(join(projectRoot, '.git'))) {
    console.error('当前目录不是 git 仓库')
    process.exit(1)
  }
  if (!refExists('refs/heads/master')) {
    console.error('本地不存在 master 分支')
    process.exit(1)
  }

  const startBranch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
  console.log(`当前分支: ${startBranch}`)

  const missing = syncPaths.filter((relative) => !existsSync(join(projectRoot, relative)))
  if (missing.length === syncPaths.length) {
    console.error('未找到任何待同步文件（AGENTS.md / knowledge / .cursor/rules）')
    process.exit(1)
  }

  copyTree(projectRoot, stagingRoot)
  console.log('已暂存本机图谱文件到 .data/vibe-sync-staging')

  let onVibe = false
  try {
    ensureVibeBranch()
    git(['checkout', vibeBranch])
    onVibe = true
    console.log(`已切换到 ${vibeBranch}`)

    if (startBranch !== vibeBranch) {
      // vibe 刚从 master 建出时已是快进关系，仍显式 merge 保持脚本路径统一
      console.log('合并 master …')
      git(['merge', 'master', '--no-edit', '-m', 'merge: master into vibe'])
    }

    restoreStagingIntoProject()
    git(['add', '-f', ...syncPaths])

    const staged = git(['diff', '--cached', '--name-only'])
    if (staged) {
      git(['commit', '-m', commitMessage])
      console.log(`已提交: ${commitMessage}`)
    } else {
      console.log('图谱无变更，跳过提交')
    }

    console.log(`推送 origin/${vibeBranch} …`)
    git(['push', '-u', 'origin', vibeBranch], { stdio: 'inherit' })
    console.log('vibe 同步完成')
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = error instanceof Error && 'exitCode' in error ? Number(error.exitCode) || 1 : 1
  } finally {
    if (onVibe || git(['rev-parse', '--abbrev-ref', 'HEAD']) === vibeBranch) {
      try {
        if (startBranch !== vibeBranch && refExists(`refs/heads/${startBranch}`)) {
          git(['checkout', startBranch])
          console.log(`已切回 ${startBranch}`)
        }
      } catch (checkoutError) {
        console.error(
          checkoutError instanceof Error ? checkoutError.message : checkoutError
        )
        process.exitCode = 1
      }
    }
    rmSync(stagingRoot, { recursive: true, force: true })
  }
}

main()
