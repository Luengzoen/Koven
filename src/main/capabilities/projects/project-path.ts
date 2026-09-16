import { basename, normalize } from 'node:path'

export function canonicalizeProjectPath(projectPath: string): string {
  return normalize(projectPath.trim().replace(/[\\/]+$/, ''))
}

export function projectPathKey(projectPath: string): string {
  return canonicalizeProjectPath(projectPath).toLowerCase()
}

export function folderNameFromPath(projectPath: string): string {
  const name = basename(projectPath)
  return name.length > 0 ? name : projectPath
}
