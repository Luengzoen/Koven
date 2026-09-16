import type { DatabaseSync } from 'node:sqlite'

function tableHasColumn(database: DatabaseSync, table: string, column: string): boolean {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  return rows.some((row) => row.name === column)
}

/**
 * 一次性旧库 schema 修补：仅当本地库仍是更早列名时触发。
 * 业务代码与产品文案一律用 project_path / 项目目录，不要再引入旧词。
 */
export function migrateLegacyProjectColumns(database: DatabaseSync): void {
  // 旧列名仅出现在此迁移里，供已有 .data 库升级
  const legacyPathColumn = 'workspace_path'
  const hasLegacy = tableHasColumn(database, 'projects', legacyPathColumn)
  const hasCurrent = tableHasColumn(database, 'projects', 'project_path')
  if (hasLegacy && !hasCurrent) {
    database.exec(`ALTER TABLE projects RENAME COLUMN ${legacyPathColumn} TO project_path`)
  }
  database.exec(`DROP INDEX IF EXISTS idx_projects_workspace_active`)
}
