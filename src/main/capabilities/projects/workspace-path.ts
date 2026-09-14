import { basename, normalize } from 'node:path'

/** 去掉尾部分隔符并 normalize，便于去重比较与落盘 */
export function canonicalizeWorkspacePath(workspacePath: string): string {
  return normalize(workspacePath.trim().replace(/[\\/]+$/, ''))
}

/** Windows 路径大小写不敏感比较键 */
export function workspacePathKey(workspacePath: string): string {
  return canonicalizeWorkspacePath(workspacePath).toLowerCase()
}

export function folderNameFromPath(workspacePath: string): string {
  const name = basename(workspacePath)
  return name.length > 0 ? name : workspacePath
}
