import { randomUUID } from 'node:crypto'
import type {
  CreateProjectWithTaskInput,
  CreateProjectWithTaskResult,
  CreateTaskInput,
  RemoveTaskResult,
  RenameTaskInput,
  TaskRecord,
  UpdateTaskStatusInput
} from '@shared/capabilities/projects'
import { err, ok, type Result } from '@shared/kernel/result'
import type { DatabaseSync } from 'node:sqlite'
import { getProjectsDb } from './db'
import {
  TASK_STATUSES,
  asNumber,
  asString,
  mapProject,
  mapTask,
  now,
  queryAll,
  queryOne,
  runSql,
  truncateTitle
} from './row-utils'
import {
  canonicalizeWorkspacePath,
  folderNameFromPath,
  workspacePathKey
} from './workspace-path'

export async function createProjectWithTask(
  input: CreateProjectWithTaskInput
): Promise<Result<CreateProjectWithTaskResult>> {
  try {
    const workspacePath = canonicalizeWorkspacePath(input.workspacePath)
    if (!workspacePath) {
      return err('projects.invalid-workspace', '请先选择工作空间')
    }
    const title = truncateTitle(input.title)
    if (!title) {
      return err('projects.invalid-title', '请先输入内容')
    }

    const database = getProjectsDb()
    const pathKey = workspacePathKey(workspacePath)
    const existingRow = queryAll(
      database,
      `SELECT * FROM projects WHERE archived = 0`
    ).find((row) => workspacePathKey(asString(row.workspace_path)) === pathKey)

    if (existingRow) {
      const project = mapProject(existingRow)
      const taskResult = await createTask({ projectId: project.id, title: input.title })
      if (!taskResult.ok) return taskResult
      return ok({ project, task: taskResult.value })
    }

    const ts = now()
    const projectId = randomUUID()
    const taskId = randomUUID()
    const name = (input.name?.trim() || folderNameFromPath(workspacePath)).slice(0, 200)
    const maxOrderRow = queryOne(
      database,
      `SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM projects`
    )
    const sortOrder = asNumber(maxOrderRow?.max_order ?? -1) + 1

    runSql(
      database,
      `INSERT INTO projects (id, name, workspace_path, sort_order, archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [projectId, name, workspacePath, sortOrder, ts, ts]
    )
    runSql(
      database,
      `INSERT INTO tasks (id, project_id, title, status, archived, last_chat_at, created_at, updated_at)
       VALUES (?, ?, ?, 'loading', 0, ?, ?, ?)`,
      [taskId, projectId, title, ts, ts, ts]
    )

    const project = mapProject(
      queryOne(database, `SELECT * FROM projects WHERE id = ?`, [projectId])!
    )
    const task = mapTask(queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [taskId])!)
    return ok({ project, task })
  } catch (error) {
    return err(
      'projects.create-project-failed',
      error instanceof Error ? error.message : '创建项目失败'
    )
  }
}

export async function createTask(input: CreateTaskInput): Promise<Result<TaskRecord>> {
  try {
    const title = truncateTitle(input.title)
    if (!title) {
      return err('projects.invalid-title', '请先输入内容')
    }
    const database = getProjectsDb()
    const project = queryOne(
      database,
      `SELECT * FROM projects WHERE id = ? AND archived = 0`,
      [input.projectId]
    )
    if (!project) {
      return err('projects.not-found', '项目不存在')
    }
    const ts = now()
    const taskId = randomUUID()
    runSql(
      database,
      `INSERT INTO tasks (id, project_id, title, status, archived, last_chat_at, created_at, updated_at)
       VALUES (?, ?, ?, 'loading', 0, ?, ?, ?)`,
      [taskId, input.projectId, title, ts, ts, ts]
    )
    runSql(database, `UPDATE projects SET updated_at = ? WHERE id = ?`, [ts, input.projectId])
    return ok(mapTask(queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [taskId])!))
  } catch (error) {
    return err('projects.create-task-failed', error instanceof Error ? error.message : '创建任务失败')
  }
}

export async function renameTask(input: RenameTaskInput): Promise<Result<TaskRecord>> {
  try {
    const title = input.title.trim().replace(/\s+/g, ' ')
    if (!title) {
      return err('projects.invalid-title', '标题不能为空')
    }
    const database = getProjectsDb()
    const existing = queryOne(
      database,
      `SELECT * FROM tasks WHERE id = ? AND archived = 0`,
      [input.taskId]
    )
    if (!existing) {
      return err('projects.task-not-found', '任务不存在')
    }
    const ts = now()
    runSql(database, `UPDATE tasks SET title = ?, updated_at = ? WHERE id = ?`, [
      title.slice(0, 200),
      ts,
      input.taskId
    ])
    return ok(mapTask(queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [input.taskId])!))
  } catch (error) {
    return err('projects.rename-failed', error instanceof Error ? error.message : '重命名失败')
  }
}

export async function archiveTask(taskId: string): Promise<Result<RemoveTaskResult>> {
  try {
    const database = getProjectsDb()
    const existing = queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [taskId])
    if (!existing) {
      return err('projects.task-not-found', '任务不存在')
    }
    const projectId = asString(existing.project_id)
    const ts = now()
    runSql(database, `UPDATE tasks SET archived = 1, updated_at = ? WHERE id = ?`, [ts, taskId])
    const removedProjectId = removeProjectIfNoActiveTasks(database, projectId)
    return ok({ taskId, removedProjectId })
  } catch (error) {
    return err('projects.archive-failed', error instanceof Error ? error.message : '归档失败')
  }
}

export async function deleteTask(taskId: string): Promise<Result<RemoveTaskResult>> {
  try {
    const database = getProjectsDb()
    const existing = queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [taskId])
    if (!existing) {
      return err('projects.task-not-found', '任务不存在')
    }
    const projectId = asString(existing.project_id)
    runSql(database, `DELETE FROM tasks WHERE id = ?`, [taskId])
    const removedProjectId = removeProjectIfNoActiveTasks(database, projectId)
    return ok({ taskId, removedProjectId })
  } catch (error) {
    return err('projects.delete-failed', error instanceof Error ? error.message : '删除失败')
  }
}

/** 项目下已无未归档任务时硬删项目及其残留任务 */
function removeProjectIfNoActiveTasks(database: DatabaseSync, projectId: string): string | null {
  const countRow = queryOne(
    database,
    `SELECT COUNT(*) AS c FROM tasks WHERE project_id = ? AND archived = 0`,
    [projectId]
  )
  if (asNumber(countRow?.c) > 0) return null
  runSql(database, `DELETE FROM tasks WHERE project_id = ?`, [projectId])
  runSql(database, `DELETE FROM projects WHERE id = ?`, [projectId])
  return projectId
}

export async function updateTaskStatus(
  input: UpdateTaskStatusInput
): Promise<Result<TaskRecord>> {
  try {
    if (!TASK_STATUSES.has(input.status)) {
      return err('projects.invalid-status', '状态不合法')
    }
    const database = getProjectsDb()
    const existing = queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [input.taskId])
    if (!existing) {
      return err('projects.task-not-found', '任务不存在')
    }
    const ts = now()
    runSql(database, `UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?`, [
      input.status,
      ts,
      input.taskId
    ])
    return ok(mapTask(queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [input.taskId])!))
  } catch (error) {
    return err('projects.status-failed', error instanceof Error ? error.message : '更新状态失败')
  }
}

export async function touchTaskChat(taskId: string): Promise<Result<TaskRecord>> {
  try {
    const database = getProjectsDb()
    const existing = queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [taskId])
    if (!existing) {
      return err('projects.task-not-found', '任务不存在')
    }
    const ts = now()
    runSql(database, `UPDATE tasks SET last_chat_at = ?, updated_at = ? WHERE id = ?`, [
      ts,
      ts,
      taskId
    ])
    return ok(mapTask(queryOne(database, `SELECT * FROM tasks WHERE id = ?`, [taskId])!))
  } catch (error) {
    return err('projects.touch-failed', error instanceof Error ? error.message : '更新聊天时间失败')
  }
}
