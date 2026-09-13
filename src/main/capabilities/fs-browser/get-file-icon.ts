import { app, nativeImage, shell, type NativeImage } from 'electron'
import { err, ok, type Result } from '@shared/kernel/result'
import { normalizeWinPath } from './path-guard'

const MAX_CACHE = 256
const cache = new Map<string, string>()

function touch(key: string, dataUrl: string): void {
  cache.delete(key)
  cache.set(key, dataUrl)
  while (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

function isLnkPath(path: string): boolean {
  return path.toLowerCase().endsWith('.lnk')
}

/** `C:\app.exe,1` / `%SystemRoot%\System32\shell32.dll,4` */
function parseIconLocation(raw: string): { path: string; index: number } {
  const trimmed = raw.trim().replace(/^"|"$/g, '')
  const match = /^(.*),(-?\d+)$/.exec(trimmed)
  if (!match) return { path: trimmed, index: 0 }
  return { path: match[1].trim().replace(/^"|"$/g, ''), index: Number(match[2]) }
}

async function iconFromPath(candidate: string): Promise<NativeImage | null> {
  const normalized = normalizeWinPath(candidate) ?? candidate
  try {
    // .ico 可直接读
    if (/\.ico$/i.test(normalized)) {
      const fromIco = nativeImage.createFromPath(normalized)
      if (!fromIco.isEmpty()) return fromIco
    }
    const fromShell = await app.getFileIcon(normalized, { size: 'small' })
    if (!fromShell.isEmpty()) return fromShell
  } catch {
    // try next
  }
  return null
}

/**
 * .lnk 不要直接 getFileIcon(lnk)：多数情况只会拿到「白纸+快捷箭头」。
 * 先 readShortcutLink 取 icon / target，再对真实路径取图标。
 */
async function iconFromShortcut(lnkPath: string): Promise<NativeImage | null> {
  let details: ReturnType<typeof shell.readShortcutLink>
  try {
    details = shell.readShortcutLink(lnkPath)
  } catch {
    return null
  }

  if (details.icon) {
    const { path: iconPath } = parseIconLocation(details.icon)
    if (iconPath) {
      const fromIcon = await iconFromPath(iconPath)
      if (fromIcon) return fromIcon
    }
  }

  if (details.target) {
    const fromTarget = await iconFromPath(details.target)
    if (fromTarget) return fromTarget
  }

  return null
}

/** 取系统壳图标；.lnk 解析为目标/自定义图标。返回 PNG data URL */
export async function getFileIconDataUrl(
  inputPath: string
): Promise<Result<string | null>> {
  const path = normalizeWinPath(inputPath)
  if (!path) {
    return err('FS_BROWSER_INVALID_PATH', '路径无效')
  }

  const key = path.toLowerCase()
  const hit = cache.get(key)
  if (hit) {
    touch(key, hit)
    return ok(hit)
  }

  try {
    let image: NativeImage | null = null
    if (isLnkPath(path)) {
      image = await iconFromShortcut(path)
    }
    if (!image || image.isEmpty()) {
      image = await app.getFileIcon(path, { size: 'small' })
    }
    if (!image || image.isEmpty()) return ok(null)

    const dataUrl = image.toDataURL()
    touch(key, dataUrl)
    return ok(dataUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return err('FS_BROWSER_ICON_FAILED', message)
  }
}
