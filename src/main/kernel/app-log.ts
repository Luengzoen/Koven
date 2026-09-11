import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { getLogsRoot } from '../env'

export type LogLevel = 'info' | 'warn' | 'error'

function stamp(): string {
  return new Date().toISOString()
}

function line(level: LogLevel, scope: string, message: string): string {
  return `${stamp()} [${level}] [${scope}] ${message}\n`
}

function append(level: LogLevel, scope: string, message: string): void {
  try {
    const root = getLogsRoot()
    mkdirSync(root, { recursive: true })
    const file = join(root, 'main.log')
    appendFileSync(file, line(level, scope, message), 'utf8')
  } catch {
    // logging must never break the app
  }

  const text = `[${scope}] ${message}`
  if (level === 'error') {
    console.error(text)
  } else if (level === 'warn') {
    console.warn(text)
  } else {
    console.log(text)
  }
}

export const appLog = {
  info(scope: string, message: string): void {
    append('info', scope, message)
  },
  warn(scope: string, message: string): void {
    append('warn', scope, message)
  },
  error(scope: string, message: string): void {
    append('error', scope, message)
  }
}
