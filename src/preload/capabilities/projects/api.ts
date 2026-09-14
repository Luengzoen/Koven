import { ipcRenderer } from 'electron'
import { projectsIpc, type ProjectsAPI } from '@shared/capabilities/projects'

export const projectsApi: ProjectsAPI = {
  projects: {
    listProjects: () => ipcRenderer.invoke(projectsIpc.listProjects),
    listTasks: (query) => ipcRenderer.invoke(projectsIpc.listTasks, query),
    createProjectWithTask: (input) =>
      ipcRenderer.invoke(projectsIpc.createProjectWithTask, input),
    createTask: (input) => ipcRenderer.invoke(projectsIpc.createTask, input),
    renameTask: (input) => ipcRenderer.invoke(projectsIpc.renameTask, input),
    archiveTask: (taskId) => ipcRenderer.invoke(projectsIpc.archiveTask, taskId),
    deleteTask: (taskId) => ipcRenderer.invoke(projectsIpc.deleteTask, taskId),
    updateTaskStatus: (input) => ipcRenderer.invoke(projectsIpc.updateTaskStatus, input),
    touchTaskChat: (taskId) => ipcRenderer.invoke(projectsIpc.touchTaskChat, taskId),
    search: (query) => ipcRenderer.invoke(projectsIpc.search, query),
    getTask: (taskId) => ipcRenderer.invoke(projectsIpc.getTask, taskId)
  }
}
