/**
 * 将 Agent 图谱/规则同步到 vibe 分支并推送。
 * master 忽略这些路径；切回 master 后会把本机文件从暂存区还原（避免被 Git 删掉）。
 *
 *   npm run sync:vibe
 */
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { dirname, join } from 'node:path'
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
  return {
    ok: result.status === 0,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim()
  }
}

function refExists(ref) {
  return gitAllowFail(['show-ref', '--verify', '--quiet', ref]).ok
}

function pathExistsInRef(ref, relativePath) {
  return gitAllowFail(['ls-tree', '--name-only', ref, '--', relativePath]).stdout.length > 0
}

function countExisting(root) {
  return syncPaths.filter((relative) => existsSync(join(root, relative))).length
}

function copyTree(from, to) {
  rmSync(to, { recursive: true, force: true })
  mkdirSync(to, { recursive: true })
  for (const relative of syncPaths) {
    const source = join(from, relative)
    if (!existsSync(source)) continue
    cpSync(source, join(to, relative), { recursive: true })
  }
}

function restoreStagingIntoProject() {
  for (const relative of syncPaths) {
    const source = join(stagingRoot, relative)
    if (!existsSync(source)) continue
    const target = join(projectRoot, relative)
    rmSync(target, { recursive: true, force: true })
    mkdirSync(dirname(target), { recursive: true })
    cpSync(source, target, { recursive: true })
  }
}

function unstageSyncPaths() {
  gitAllowFail(['reset', '-q', 'HEAD', '--', ...syncPaths])
}

/** 从指定 ref 检出同步路径到 staging（不依赖当前工作区） */
function exportRefToStaging(ref) {
  const available = syncPaths.filter((relative) => pathExistsInRef(ref, relative))
  if (available.length === 0) {
    return false
  }

  rmSync(stagingRoot, { recursive: true, force: true })
  mkdirSync(stagingRoot, { recursive: true })

  const result = spawnSync(
    'git',
    [`--work-tree=${stagingRoot}`, 'checkout', ref, '--', ...available],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )
  // checkout 进 work-tree 仍可能弄脏当前分支 index，立刻摘掉
  unstageSyncPaths()

  if (result.status !== 0) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join('\n').trim()
    throw new Error(`从 ${ref} 导出图谱失败${detail ? `\n${detail}` : ''}`)
  }
  return countExisting(stagingRoot) > 0
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

function prepareStaging() {
  if (countExisting(projectRoot) > 0) {
    copyTree(projectRoot, stagingRoot)
    console.log('已暂存本机图谱文件')
    return
  }

  const sourceRef = refExists(`refs/heads/${vibeBranch}`)
    ? vibeBranch
    : refExists(`refs/remotes/origin/${vibeBranch}`)
      ? `origin/${vibeBranch}`
      : null

  if (!sourceRef) {
    throw new Error(
      '工作区没有图谱文件，且本地/远程尚无 vibe 上的副本。请先恢复 AGENTS.md / knowledge / .cursor/rules'
    )
  }

  console.log(`工作区缺少图谱，改从 ${sourceRef} 导出 …`)
  if (!exportRefToStaging(sourceRef)) {
    throw new Error(`从 ${sourceRef} 未导出到任何图谱文件`)
  }
  console.log('已从 vibe 导出到暂存区')
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

  let onVibe = false
  try {
    prepareStaging()
    // 占位，避免空目录被忽略工具清掉观感
    writeFileSync(join(stagingRoot, '.keep'), '')

    ensureVibeBranch()
    git(['checkout', vibeBranch])
    onVibe = true
    console.log(`已切换到 ${vibeBranch}`)

    if (startBranch !== vibeBranch) {
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
    try {
      const now = gitAllowFail(['rev-parse', '--abbrev-ref', 'HEAD']).stdout
      if (now === vibeBranch && startBranch !== vibeBranch && refExists(`refs/heads/${startBranch}`)) {
        git(['checkout', startBranch])
        console.log(`已切回 ${startBranch}`)
      }
    } catch (checkoutError) {
      console.error(checkoutError instanceof Error ? checkoutError.message : checkoutError)
      process.exitCode = 1
    }

    // 切回 master 后 Git 会删掉仅在 vibe 跟踪的文件 → 从暂存区写回本机
    if (existsSync(stagingRoot) && countExisting(stagingRoot) > 0) {
      restoreStagingIntoProject()
      unstageSyncPaths()
      console.log('已将图谱文件写回本机工作区（master 仍忽略它们）')
    }
    rmSync(stagingRoot, { recursive: true, force: true })
  }
}

main()
