import { ipcMain } from 'electron'
import { projectsIpc } from '@shared/capabilities/projects'
import type {
  CreateProjectWithTaskInput,
  CreateTaskInput,
  ListTasksQuery,
  RenameTaskInput,
  SearchQuery,
  UpdateTaskStatusInput
} from '@shared/capabilities/projects'
import {
  archiveTask,
  createProjectWithTask,
  createTask,
  deleteTask,
  renameTask,
  touchTaskChat,
  updateTaskStatus
} from './mutations'
import { getTask, listProjects, listTasks, searchProjects } from './queries'

export function registerProjects(): void {
  ipcMain.handle(projectsIpc.listProjects, () => listProjects())
  ipcMain.handle(projectsIpc.listTasks, (_event, query: ListTasksQuery) => listTasks(query))
  ipcMain.handle(projectsIpc.createProjectWithTask, (_event, input: CreateProjectWithTaskInput) =>
    createProjectWithTask(input)
  )
  ipcMain.handle(projectsIpc.createTask, (_event, input: CreateTaskInput) => createTask(input))
  ipcMain.handle(projectsIpc.renameTask, (_event, input: RenameTaskInput) => renameTask(input))
  ipcMain.handle(projectsIpc.archiveTask, (_event, taskId: string) => archiveTask(taskId))
  ipcMain.handle(projectsIpc.deleteTask, (_event, taskId: string) => deleteTask(taskId))
  ipcMain.handle(projectsIpc.updateTaskStatus, (_event, input: UpdateTaskStatusInput) =>
    updateTaskStatus(input)
  )
  ipcMain.handle(projectsIpc.touchTaskChat, (_event, taskId: string) => touchTaskChat(taskId))
  ipcMain.handle(projectsIpc.search, (_event, query: SearchQuery) => searchProjects(query))
  ipcMain.handle(projectsIpc.getTask, (_event, taskId: string) => getTask(taskId))
}
