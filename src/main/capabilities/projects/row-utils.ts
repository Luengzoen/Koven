import type { DatabaseSync } from 'node:sqlite'
import type { ProjectRecord, TaskRecord, TaskStatus } from '@shared/capabilities/projects'
import { PROJECTS_PAGE_SIZE } from '@shared/capabilities/projects'

/** node:sqlite 绑定值；禁止传 undefined（会报错，须 ?? null） */
export type SqlParam = null | number | bigint | string | Uint8Array

export type SqlRow = Record<string, SqlParam>

export const TASK_STATUSES = new Set<TaskStatus>(['loading', 'finished', 'error', 'idle'])

export function now(): number {
  return Date.now()
}

export function asNumber(value: SqlParam | undefined): number {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string') return Number(value)
  return 0
}

export function asString(value: SqlParam | undefined): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  return String(value)
}

export function asBool(value: SqlParam | undefined): boolean {
  return asNumber(value) === 1
}

export function asStatus(value: SqlParam | undefined): TaskStatus {
  const raw = asString(value)
  return TASK_STATUSES.has(raw as TaskStatus) ? (raw as TaskStatus) : 'idle'
}

export function mapProject(row: SqlRow): ProjectRecord {
  return {
    id: asString(row.id),
    name: asString(row.name),
    workspacePath: asString(row.workspace_path),
    sortOrder: asNumber(row.sort_order),
    archived: asBool(row.archived),
    createdAt: asNumber(row.created_at),
    updatedAt: asNumber(row.updated_at)
  }
}

export function mapTask(row: SqlRow): TaskRecord {
  return {
    id: asString(row.id),
    projectId: asString(row.project_id),
    title: asString(row.title),
    status: asStatus(row.status),
    archived: asBool(row.archived),
    lastChatAt: asNumber(row.last_chat_at),
    createdAt: asNumber(row.created_at),
    updatedAt: asNumber(row.updated_at)
  }
}

export function queryAll(
  database: DatabaseSync,
  sql: string,
  params: SqlParam[] = []
): SqlRow[] {
  const rows = database.prepare(sql).all(...params) as SqlRow[]
  return rows
}

export function queryOne(
  database: DatabaseSync,
  sql: string,
  params: SqlParam[] = []
): SqlRow | null {
  const row = database.prepare(sql).get(...params) as SqlRow | undefined
  return row ?? null
}

export function runSql(
  database: DatabaseSync,
  sql: string,
  params: SqlParam[] = []
): void {
  database.prepare(sql).run(...params)
}

export function clampLimit(limit: number | undefined): number {
  if (limit == null || !Number.isFinite(limit) || limit <= 0) return PROJECTS_PAGE_SIZE
  return Math.min(Math.floor(limit), 100)
}

export function clampOffset(offset: number | undefined): number {
  if (offset == null || !Number.isFinite(offset) || offset < 0) return 0
  return Math.floor(offset)
}

export function truncateTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').slice(0, 15)
}
