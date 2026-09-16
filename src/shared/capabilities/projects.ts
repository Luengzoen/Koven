import type { Result } from '../kernel/result'

export const projectsIpc = {
  listProjects: 'projects:list-projects',
  listTasks: 'projects:list-tasks',
  createProjectWithTask: 'projects:create-project-with-task',
  createTask: 'projects:create-task',
  renameTask: 'projects:rename-task',
  archiveTask: 'projects:archive-task',
  deleteTask: 'projects:delete-task',
  updateTaskStatus: 'projects:update-task-status',
  touchTaskChat: 'projects:touch-task-chat',
  search: 'projects:search',
  getTask: 'projects:get-task'
} as const

export const TASK_PAGE_PREFIX = 'task:' as const

export type TaskStatus = 'loading' | 'finished' | 'error' | 'idle'

export type ProjectRecord = {
  id: string
  name: string
  /** 项目在磁盘上的根目录（项目目录） */
  projectPath: string
  sortOrder: number
  archived: boolean
  createdAt: number
  updatedAt: number
}

export type TaskRecord = {
  id: string
  projectId: string
  title: string
  status: TaskStatus
  archived: boolean
  lastChatAt: number
  createdAt: number
  updatedAt: number
}

export type TaskPageId = `${typeof TASK_PAGE_PREFIX}${string}`

export function toTaskPageId(taskId: string): TaskPageId {
  return `${TASK_PAGE_PREFIX}${taskId}`
}

export function parseTaskPageId(pageId: string): string | null {
  if (!pageId.startsWith(TASK_PAGE_PREFIX)) return null
  const id = pageId.slice(TASK_PAGE_PREFIX.length)
  return id.length > 0 ? id : null
}

export type ListTasksQuery = {
  projectId: string
  offset?: number
  limit?: number
}

export type ListTasksResult = {
  tasks: TaskRecord[]
  hasMore: boolean
}

export type CreateProjectWithTaskInput = {
  projectPath: string
  /** 文件夹名；主进程也会再从路径兜底一次 */
  name?: string
  title: string
}

export type CreateProjectWithTaskResult = {
  project: ProjectRecord
  task: TaskRecord
}

export type CreateTaskInput = {
  projectId: string
  title: string
}

export type RenameTaskInput = {
  taskId: string
  title: string
}

/** 归档/删除任务；若项目已无未归档任务则一并移除项目 */
export type RemoveTaskResult = {
  taskId: string
  removedProjectId: string | null
}

export type UpdateTaskStatusInput = {
  taskId: string
  status: TaskStatus
}

export type SearchQuery = {
  query: string
  offset?: number
  limit?: number
}

export type SearchHit =
  | { kind: 'project'; project: ProjectRecord }
  | { kind: 'task'; project: ProjectRecord; task: TaskRecord }

export type SearchResult = {
  hits: SearchHit[]
  hasMore: boolean
}

export const PROJECTS_PAGE_SIZE = 10

export type ProjectsAPI = {
  projects: {
    listProjects: () => Promise<Result<ProjectRecord[]>>
    listTasks: (query: ListTasksQuery) => Promise<Result<ListTasksResult>>
    createProjectWithTask: (
      input: CreateProjectWithTaskInput
    ) => Promise<Result<CreateProjectWithTaskResult>>
    createTask: (input: CreateTaskInput) => Promise<Result<TaskRecord>>
    renameTask: (input: RenameTaskInput) => Promise<Result<TaskRecord>>
  archiveTask: (taskId: string) => Promise<Result<RemoveTaskResult>>
  deleteTask: (taskId: string) => Promise<Result<RemoveTaskResult>>
    updateTaskStatus: (input: UpdateTaskStatusInput) => Promise<Result<TaskRecord>>
    touchTaskChat: (taskId: string) => Promise<Result<TaskRecord>>
    search: (query: SearchQuery) => Promise<Result<SearchResult>>
    getTask: (taskId: string) => Promise<Result<TaskRecord | null>>
  }
}
