import type {
  ListTasksQuery,
  ListTasksResult,
  ProjectRecord,
  SearchHit,
  SearchQuery,
  SearchResult,
  TaskRecord
} from '@shared/capabilities/projects'
import { err, ok, type Result } from '@shared/kernel/result'
import { getProjectsDb } from './db'
import {
  asBool,
  asNumber,
  asStatus,
  asString,
  clampLimit,
  clampOffset,
  mapProject,
  mapTask,
  queryAll,
  queryOne
} from './row-utils'

export async function listProjects(): Promise<Result<ProjectRecord[]>> {
  try {
    const database = getProjectsDb()
    const rows = queryAll(
      database,
      `SELECT * FROM projects WHERE archived = 0 ORDER BY sort_order ASC, created_at ASC`
    )
    return ok(rows.map(mapProject))
  } catch (error) {
    return err('projects.list-failed', error instanceof Error ? error.message : '列出项目失败')
  }
}

export async function listTasks(query: ListTasksQuery): Promise<Result<ListTasksResult>> {
  try {
    const database = getProjectsDb()
    const limit = clampLimit(query.limit)
    const offset = clampOffset(query.offset)
    const rows = queryAll(
      database,
      `SELECT * FROM tasks
       WHERE project_id = ? AND archived = 0
       ORDER BY last_chat_at DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [query.projectId, limit + 1, offset]
    )
    const hasMore = rows.length > limit
    return ok({ tasks: rows.slice(0, limit).map(mapTask), hasMore })
  } catch (error) {
    return err('projects.list-tasks-failed', error instanceof Error ? error.message : '列出任务失败')
  }
}

export async function getTask(taskId: string): Promise<Result<TaskRecord | null>> {
  try {
    const database = getProjectsDb()
    const row = queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [taskId])
    return ok(row ? mapTask(row) : null)
  } catch (error) {
    return err('projects.get-task-failed', error instanceof Error ? error.message : '读取任务失败')
  }
}

export async function searchProjects(query: SearchQuery): Promise<Result<SearchResult>> {
  try {
    const q = query.query.trim()
    if (!q) return ok({ hits: [], hasMore: false })

    const database = getProjectsDb()
    const limit = clampLimit(query.limit)
    const offset = clampOffset(query.offset)
    const like = `%${q.replace(/[%_]/g, '')}%`

    const rows = queryAll(
      database,
      `SELECT * FROM (
         SELECT
           'project' AS hit_kind,
           p.id AS project_id,
           p.name AS project_name,
           p.project_path,
           p.sort_order,
           p.archived AS project_archived,
           p.created_at AS project_created_at,
           p.updated_at AS project_updated_at,
           NULL AS task_id,
           NULL AS task_title,
           NULL AS task_status,
           NULL AS task_archived,
           NULL AS last_chat_at,
           NULL AS task_created_at,
           NULL AS task_updated_at,
           p.updated_at AS rank_at
         FROM projects p
         WHERE p.archived = 0 AND p.name LIKE ? COLLATE NOCASE
         UNION ALL
         SELECT
           'task' AS hit_kind,
           p.id AS project_id,
           p.name AS project_name,
           p.project_path,
           p.sort_order,
           p.archived AS project_archived,
           p.created_at AS project_created_at,
           p.updated_at AS project_updated_at,
           t.id AS task_id,
           t.title AS task_title,
           t.status AS task_status,
           t.archived AS task_archived,
           t.last_chat_at AS last_chat_at,
           t.created_at AS task_created_at,
           t.updated_at AS task_updated_at,
           t.last_chat_at AS rank_at
         FROM tasks t
         INNER JOIN projects p ON p.id = t.project_id
         WHERE t.archived = 0 AND p.archived = 0 AND t.title LIKE ? COLLATE NOCASE
       )
       ORDER BY rank_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, limit + 1, offset]
    )

    const hasMore = rows.length > limit
    const hits: SearchHit[] = rows.slice(0, limit).map((row) => {
      const project: ProjectRecord = {
        id: asString(row.project_id),
        name: asString(row.project_name),
        projectPath: asString(row.project_path),
        sortOrder: asNumber(row.sort_order),
        archived: asBool(row.project_archived),
        createdAt: asNumber(row.project_created_at),
        updatedAt: asNumber(row.project_updated_at)
      }
      if (asString(row.hit_kind) === 'project') {
        return { kind: 'project', project }
      }
      return {
        kind: 'task',
        project,
        task: {
          id: asString(row.task_id),
          projectId: project.id,
          title: asString(row.task_title),
          status: asStatus(row.task_status),
          archived: asBool(row.task_archived),
          lastChatAt: asNumber(row.last_chat_at),
          createdAt: asNumber(row.task_created_at),
          updatedAt: asNumber(row.task_updated_at)
        }
      }
    })
    return ok({ hits, hasMore })
  } catch (error) {
    return err('projects.search-failed', error instanceof Error ? error.message : '搜索失败')
  }
}
