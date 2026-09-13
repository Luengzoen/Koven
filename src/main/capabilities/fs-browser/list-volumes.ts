import { access, constants } from 'node:fs/promises'
import { err, ok, type Result } from '@shared/kernel/result'
import type { FsBrowserListEntry } from '@shared/capabilities/fs-browser'

const DRIVE_LETTERS = 'CDEFGHIJKLMNOPQRSTUVWXYZAB'

async function probeDrive(letter: string): Promise<FsBrowserListEntry | null> {
  const root = `${letter}:\\`
  try {
    await access(root, constants.R_OK)
  } catch {
    return null
  }

  return {
    path: root,
    name: `${letter}:`,
    kind: 'volume',
    extension: '',
    isHidden: false,
    isSystem: false
  }
}

/** 枚举本机逻辑卷（不读 MFT；列根即可） */
export async function listVolumes(): Promise<Result<FsBrowserListEntry[]>> {
  try {
    const probes = [...DRIVE_LETTERS].map((letter) => probeDrive(letter))
    const settled = await Promise.all(probes)
    const volumes = settled.filter((v): v is FsBrowserListEntry => v !== null)
    // C: 优先，其余按字母
    volumes.sort((a, b) => a.path.localeCompare(b.path, 'en'))
    return ok(volumes)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return err('FS_BROWSER_VOLUMES_FAILED', message)
  }
}
