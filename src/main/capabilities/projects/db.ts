import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { getDataRoot } from '../../env'
import { appLog } from '../../kernel/app-log'
import { migrateLegacyProjectColumns } from './migrate-legacy-columns'
import { repairProjectIntegrity } from './repair'

let db: DatabaseSync | null = null

function resolveDbPath(): string {
  const dir = join(getDataRoot(), 'capabilities', 'projects')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'koven.db')
}

function migrate(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      project_path TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `)
  migrateLegacyProjectColumns(database)
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      archived INTEGER NOT NULL DEFAULT 0,
      last_chat_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `)
  database.exec(
    `CREATE INDEX IF NOT EXISTS idx_tasks_project_chat
     ON tasks(project_id, archived, last_chat_at DESC);`
  )
  database.exec(
    `CREATE INDEX IF NOT EXISTS idx_projects_sort
     ON projects(archived, sort_order ASC);`
  )
  repairProjectIntegrity(database)
}

/** 打开（或复用）项目库：node:sqlite 零依赖，落盘 koven.db */
export function getProjectsDb(): DatabaseSync {
  if (db) return db
  const path = resolveDbPath()
  appLog.info('projects', `opening sqlite ${path}`)
  const started = Date.now()
  try {
    db = new DatabaseSync(path)
    db.exec('PRAGMA journal_mode = WAL;')
    db.exec('PRAGMA foreign_keys = ON;')
    migrate(db)
    appLog.info('projects', `sqlite ready in ${Date.now() - started}ms`)
    return db
  } catch (error) {
    db = null
    appLog.error(
      'projects',
      `sqlite init failed: ${error instanceof Error ? error.message : String(error)}`
    )
    throw error
  }
}

export function closeProjectsDbForTests(): void {
  if (db) {
    db.close()
    db = null
  }
}
