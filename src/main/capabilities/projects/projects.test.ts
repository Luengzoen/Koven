import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetDataRootAfterTests, setDataRootForTests } from '../../env'
import { closeProjectsDbForTests } from './db'
import {
  createProjectWithTask,
  createTask,
  deleteTask,
  renameTask
} from './mutations'
import { listProjects, listTasks, searchProjects } from './queries'

describe('projects sqlite', () => {
  let root = ''

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'koven-projects-'))
    setDataRootForTests(root)
    closeProjectsDbForTests()
  })

  afterEach(() => {
    closeProjectsDbForTests()
    resetDataRootAfterTests()
    rmSync(root, { recursive: true, force: true })
  })

  it('creates project from folder name and paginates tasks', async () => {
    const created = await createProjectWithTask({
      projectPath: 'D:\\Projects\\DemoFolder',
      title: '这是一段超过十五个字的对话开头内容'
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(created.value.project.name).toBe('DemoFolder')
    expect(created.value.project.projectPath).toBe('D:\\Projects\\DemoFolder')
    expect(created.value.task.title).toBe('这是一段超过十五个字的对话开头')

    for (let i = 0; i < 12; i += 1) {
      const task = await createTask({
        projectId: created.value.project.id,
        title: `额外任务 ${i}`
      })
      expect(task.ok).toBe(true)
    }

    const page1 = await listTasks({ projectId: created.value.project.id, offset: 0, limit: 10 })
    expect(page1.ok).toBe(true)
    if (!page1.ok) return
    expect(page1.value.tasks).toHaveLength(10)
    expect(page1.value.hasMore).toBe(true)

    const page2 = await listTasks({ projectId: created.value.project.id, offset: 10, limit: 10 })
    expect(page2.ok).toBe(true)
    if (!page2.ok) return
    expect(page2.value.tasks.length).toBeGreaterThan(0)
    expect(page2.value.hasMore).toBe(false)
  })

  it('reuses existing project for same project path', async () => {
    const first = await createProjectWithTask({
      projectPath: 'D:\\Projects\\Shared',
      title: '第一次任务内容足够长'
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const second = await createProjectWithTask({
      projectPath: 'D:\\Projects\\Shared\\',
      title: '第二次任务内容也够长'
    })
    expect(second.ok).toBe(true)
    if (!second.ok) return

    expect(second.value.project.id).toBe(first.value.project.id)
    expect(second.value.task.id).not.toBe(first.value.task.id)

    const projects = await listProjects()
    expect(projects.ok).toBe(true)
    if (!projects.ok) return
    expect(projects.value.filter((p) => p.name === 'Shared')).toHaveLength(1)

    const tasks = await listTasks({ projectId: first.value.project.id, offset: 0, limit: 10 })
    expect(tasks.ok).toBe(true)
    if (!tasks.ok) return
    expect(tasks.value.tasks).toHaveLength(2)
  })

  it('removes project when last task is deleted', async () => {
    const created = await createProjectWithTask({
      projectPath: 'D:\\Projects\\Lonely',
      title: '唯一任务标题足够长'
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const deleted = await deleteTask(created.value.task.id)
    expect(deleted.ok).toBe(true)
    if (!deleted.ok) return
    expect(deleted.value.removedProjectId).toBe(created.value.project.id)

    const projects = await listProjects()
    expect(projects.ok).toBe(true)
    if (!projects.ok) return
    expect(projects.value.some((p) => p.id === created.value.project.id)).toBe(false)
  })

  it('repairs duplicate project paths and empty projects on open', async () => {
    const first = await createProjectWithTask({
      projectPath: 'D:\\Projects\\RepairMe',
      title: '修复用任务甲足够长'
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return

    // 绕过去重：先去掉唯一索引再插入脏数据，再关库触发 repair
    const { getProjectsDb } = await import('./db')
    const database = getProjectsDb()
    database.exec(`DROP INDEX IF EXISTS idx_projects_path_active`)
    const ts = Date.now()
    database
      .prepare(
        `INSERT INTO projects (id, name, project_path, sort_order, archived, created_at, updated_at)
         VALUES (?, 'RepairMe', 'D:\\Projects\\RepairMe', 99, 0, ?, ?)`
      )
      .run('dup-empty', ts, ts)
    database
      .prepare(
        `INSERT INTO projects (id, name, project_path, sort_order, archived, created_at, updated_at)
         VALUES (?, 'RepairMe', 'D:\\Projects\\RepairMe\\', 100, 0, ?, ?)`
      )
      .run('dup-with-task', ts, ts)
    database
      .prepare(
        `INSERT INTO tasks (id, project_id, title, status, archived, last_chat_at, created_at, updated_at)
         VALUES ('dup-task', 'dup-with-task', '旁路任务', 'idle', 0, ?, ?, ?)`
      )
      .run(ts, ts, ts)

    closeProjectsDbForTests()
    const projects = await listProjects()
    expect(projects.ok).toBe(true)
    if (!projects.ok) return
    const repaired = projects.value.filter((p) => p.name === 'RepairMe')
    expect(repaired).toHaveLength(1)
    const tasks = await listTasks({ projectId: repaired[0]!.id, offset: 0, limit: 10 })
    expect(tasks.ok).toBe(true)
    if (!tasks.ok) return
    expect(tasks.value.tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('searches projects and tasks with hasMore', async () => {
    const a = await createProjectWithTask({
      projectPath: 'D:\\Projects\\Alpha',
      title: '搜索关键词甲'
    })
    expect(a.ok).toBe(true)
    if (!a.ok) return
    const renamed = await renameTask({ taskId: a.value.task.id, title: '更新后的搜索关键词甲' })
    expect(renamed.ok).toBe(true)

    const projects = await listProjects()
    expect(projects.ok).toBe(true)
    if (!projects.ok) return
    expect(projects.value.some((p) => p.name === 'Alpha')).toBe(true)

    const hits = await searchProjects({ query: '搜索', offset: 0, limit: 10 })
    expect(hits.ok).toBe(true)
    if (!hits.ok) return
    expect(hits.value.hits.length).toBeGreaterThan(0)
  })
})
