import { existsSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { err, ok, type Result } from '@shared/kernel/result'

/**
 * Windows-safe atomic replace: write *.tmp → move aside old → rename tmp → delete bak.
 * Never leaves a truncated target file on success path interruption mid-write.
 */
export function writeFileAtomic(filePath: string, contents: string): Result<undefined> {
  const dir = dirname(filePath)
  const tmpPath = `${filePath}.tmp`
  const bakPath = `${filePath}.bak`

  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(tmpPath, contents, 'utf8')

    if (existsSync(filePath)) {
      try {
        if (existsSync(bakPath)) {
          unlinkSync(bakPath)
        }
        renameSync(filePath, bakPath)
      } catch (error) {
        try {
          unlinkSync(tmpPath)
        } catch {
          // ignore cleanup failure
        }
        const message = error instanceof Error ? error.message : '无法备份原文件'
        return err('storage.atomic-backup-failed', message)
      }
    }

    try {
      renameSync(tmpPath, filePath)
    } catch (error) {
      if (existsSync(bakPath) && !existsSync(filePath)) {
        try {
          renameSync(bakPath, filePath)
        } catch {
          // best-effort restore
        }
      }
      try {
        if (existsSync(tmpPath)) {
          unlinkSync(tmpPath)
        }
      } catch {
        // ignore
      }
      const message = error instanceof Error ? error.message : '无法替换目标文件'
      return err('storage.atomic-replace-failed', message)
    }

    if (existsSync(bakPath)) {
      try {
        unlinkSync(bakPath)
      } catch {
        // leftover bak is harmless
      }
    }

    return ok(undefined)
  } catch (error) {
    try {
      if (existsSync(tmpPath)) {
        unlinkSync(tmpPath)
      }
    } catch {
      // ignore
    }
    const message = error instanceof Error ? error.message : '原子写入失败'
    return err('storage.atomic-write-failed', message)
  }
}
