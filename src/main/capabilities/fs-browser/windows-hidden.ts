import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * 列出目录下带 Windows Hidden 属性的项名（尊重真实属性，不靠猜测默认路径）。
 * 失败或无隐藏项时返回空集。
 */
export async function listWindowsHiddenNames(dirPath: string): Promise<Set<string>> {
  try {
    const script = [
      `$ErrorActionPreference='SilentlyContinue'`,
      `$p = ${JSON.stringify(dirPath)}`,
      `Get-ChildItem -LiteralPath $p -Force |`,
      `  Where-Object { $_.Attributes -band [IO.FileAttributes]::Hidden } |`,
      `  ForEach-Object { $_.Name }`
    ].join(' ')
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      {
        windowsHide: true,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024
      }
    )
    return new Set(
      stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
  } catch {
    return new Set()
  }
}
