import { access, constants, stat } from 'node:fs/promises'
import {
  FS_BROWSER_THIS_PC_PATH,
  type FsBrowserEntryKind,
  type FsBrowserResolvePathResult
} from '@shared/capabilities/fs-browser'
import { err, ok, type Result } from '@shared/kernel/result'
import { listKnownFolderRoots } from './list-roots'
import { isPathInsideOrEqual, normalizeWinPath, splitPathChain } from './path-guard'

function chainFromBase(base: string, target: string): string[] {
  const baseNorm = normalizeWinPath(base)
  const targetNorm = normalizeWinPath(target)
  if (!baseNorm || !targetNorm) return []
  if (baseNorm.toLowerCase() === targetNorm.toLowerCase()) return [baseNorm]

  const full = splitPathChain(targetNorm)
  if (!full) return [baseNorm]

  const baseLower = baseNorm.toLowerCase()
  const start = full.findIndex((step) => step.toLowerCase() === baseLower)
  if (start < 0) return [baseNorm]
  return full.slice(start)
}

export async function resolvePath(
  inputPath: string
): Promise<Result<FsBrowserResolvePathResult>> {
  if (inputPath === FS_BROWSER_THIS_PC_PATH) {
    return ok({
      chain: [FS_BROWSER_THIS_PC_PATH],
      exists: true,
      kind: 'this-pc'
    })
  }

  const path = normalizeWinPath(inputPath)
  if (!path) {
    return err('FS_BROWSER_INVALID_PATH', '路径无效')
  }

  const known = await listKnownFolderRoots()
  let matched: (typeof known)[number] | null = null
  for (const root of known) {
    if (!isPathInsideOrEqual(path, root.path)) continue
    if (!matched || root.path.length > matched.path.length) matched = root
  }

  let chain: string[]
  if (matched) {
    chain = chainFromBase(matched.path, path)
  } else {
    const diskChain = splitPathChain(path)
    if (!diskChain) {
      return err('FS_BROWSER_INVALID_PATH', '路径无效')
    }
    chain = [FS_BROWSER_THIS_PC_PATH, ...diskChain]
  }

  try {
    await access(path, constants.F_OK)
    const info = await stat(path)
    let kind: FsBrowserEntryKind
    if (/^[A-Za-z]:\\$/.test(path)) kind = 'volume'
    else if (info.isDirectory()) kind = 'directory'
    else kind = 'file'

    return ok({ chain, exists: true, kind })
  } catch {
    const existing: string[] = []
    for (const step of chain) {
      if (step === FS_BROWSER_THIS_PC_PATH) {
        existing.push(step)
        continue
      }
      try {
        await access(step, constants.F_OK)
        existing.push(step)
      } catch {
        break
      }
    }
    return ok({
      chain: existing.length > 0 ? existing : [chain[0]],
      exists: false,
      kind: null
    })
  }
}
