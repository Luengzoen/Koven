import type { DatabaseSync } from 'node:sqlite'
import { appLog } from '../../kernel/app-log'
import { canonicalizeProjectPath, projectPathKey } from './project-path'

type ProjectRow = {
  id: string
  project_path: string
  sort_order: number
  created_at: number
}

/**
 * 修复脏数据：同路径未归档项目合并、无未归档任务的空项目删除，
 * 并尽量加唯一索引防止再脏。
 */
export function repairProjectIntegrity(database: DatabaseSync): void {
  const projects = database
    .prepare(`SELECT id, project_path, sort_order, created_at FROM projects WHERE archived = 0`)
    .all() as ProjectRow[]

  // 统一写成规范路径
  for (const project of projects) {
    const canonical = canonicalizeProjectPath(project.project_path)
    if (canonical !== project.project_path) {
      database
        .prepare(`UPDATE projects SET project_path = ? WHERE id = ?`)
        .run(canonical, project.id)
      project.project_path = canonical
    }
  }

  const groups = new Map<string, ProjectRow[]>()
  for (const project of projects) {
    const key = projectPathKey(project.project_path)
    const bucket = groups.get(key)
    if (bucket) bucket.push(project)
    else groups.set(key, [project])
  }

  let merged = 0
  for (const group of groups.values()) {
    if (group.length < 2) continue
    group.sort((a, b) => a.sort_order - b.sort_order || a.created_at - b.created_at)
    const keeper = group[0]!
    for (const duplicate of group.slice(1)) {
      database
        .prepare(`UPDATE tasks SET project_id = ? WHERE project_id = ?`)
        .run(keeper.id, duplicate.id)
      database.prepare(`DELETE FROM projects WHERE id = ?`).run(duplicate.id)
      merged += 1
    }
  }

  const empties = database
    .prepare(
      `SELECT p.id AS id
       FROM projects p
       WHERE p.archived = 0
         AND NOT EXISTS (
           SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.archived = 0
         )`
    )
    .all() as Array<{ id: string }>

  for (const row of empties) {
    database.prepare(`DELETE FROM tasks WHERE project_id = ?`).run(row.id)
    database.prepare(`DELETE FROM projects WHERE id = ?`).run(row.id)
  }

  try {
    database.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_path_active
      ON projects(lower(project_path))
      WHERE archived = 0
    `)
  } catch (error) {
    appLog.warn(
      'projects',
      `unique project path index skipped: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  if (merged > 0 || empties.length > 0) {
    appLog.info(
      'projects',
      `repaired integrity: merged=${merged}, removedEmpty=${empties.length}`
    )
  }
}
