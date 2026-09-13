import { isAbsolute, normalize, resolve, sep } from 'node:path'

/** Windows 绝对路径规范化；拒绝相对路径与空串 */
export function normalizeWinPath(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (!isAbsolute(trimmed)) return null
  const resolved = resolve(trimmed)
  // 卷根保持 `C:\` 形式
  if (/^[A-Za-z]:\\?$/.test(resolved)) {
    return `${resolved.slice(0, 1).toUpperCase()}:\\`
  }
  return normalize(resolved)
}

export function isPathInsideOrEqual(child: string, parent: string): boolean {
  const c = normalizeWinPath(child)
  const p = normalizeWinPath(parent)
  if (!c || !p) return false
  if (c.toLowerCase() === p.toLowerCase()) return true
  const prefix = p.endsWith(sep) ? p : `${p}${sep}`
  return c.toLowerCase().startsWith(prefix.toLowerCase())
}

export function splitPathChain(absolutePath: string): string[] | null {
  const normalized = normalizeWinPath(absolutePath)
  if (!normalized) return null
  const match = /^([A-Za-z]:\\)(.*)$/.exec(normalized)
  if (!match) return null
  const root = match[1]
  const rest = match[2]
  const chain = [root]
  if (!rest) return chain
  const parts = rest.split(sep).filter(Boolean)
  let current = root.slice(0, -1) // `C:`
  for (const part of parts) {
    current = `${current}${sep}${part}`
    chain.push(current)
  }
  return chain
}

export function entryExtension(name: string, isDirectory: boolean): string {
  if (isDirectory) return ''
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

export function isDotHidden(name: string): boolean {
  return name.startsWith('.')
}
