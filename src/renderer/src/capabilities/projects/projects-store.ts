import { create } from 'zustand'
import type {
  ProjectRecord,
  SearchHit,
  TaskRecord,
  TaskStatus
} from '@shared/capabilities/projects'
import { PROJECTS_PAGE_SIZE, toTaskPageId } from '@shared/capabilities/projects'

export type ProjectTasksSlice = {
  tasks: TaskRecord[]
  hasMore: boolean
  loading: boolean
}

type ProjectsState = {
  projects: ProjectRecord[]
  tasksByProject: Record<string, ProjectTasksSlice>
  expandedIds: ReadonlySet<string>
  hydrated: boolean
  searchQuery: string
  searchHits: SearchHit[]
  searchHasMore: boolean
  searchLoading: boolean
  searchOffset: number
  hydrate: () => Promise<void>
  setExpanded: (projectId: string, expanded: boolean) => void
  toggleExpanded: (projectId: string) => void
  ensureProjectTasks: (projectId: string) => Promise<void>
  loadMoreTasks: (projectId: string) => Promise<void>
  setSearchQuery: (query: string) => void
  runSearch: (query: string, append?: boolean) => Promise<void>
  loadMoreSearch: () => Promise<void>
  upsertProjectAndTask: (project: ProjectRecord, task: TaskRecord) => void
  upsertTask: (task: TaskRecord) => void
  patchTask: (taskId: string, patch: Partial<TaskRecord>) => void
  removeTask: (taskId: string) => void
  removeProject: (projectId: string) => void
  getTaskById: (taskId: string) => TaskRecord | undefined
  getProjectById: (projectId: string) => ProjectRecord | undefined
  listSelectableTaskPageIds: () => ReadonlySet<string>
}

function emptySlice(): ProjectTasksSlice {
  return { tasks: [], hasMore: false, loading: false }
}

function sortTasks(tasks: TaskRecord[]): TaskRecord[] {
  return [...tasks].sort((a, b) => b.lastChatAt - a.lastChatAt || b.createdAt - a.createdAt)
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  tasksByProject: {},
  expandedIds: new Set(),
  hydrated: false,
  searchQuery: '',
  searchHits: [],
  searchHasMore: false,
  searchLoading: false,
  searchOffset: 0,

  hydrate: async () => {
    if (!window.koven?.projects) {
      set({ hydrated: true })
      return
    }
    try {
      const result = await window.koven.projects.listProjects()
      if (!result.ok) {
        set({ hydrated: true })
        return
      }
      const projects = result.value
      const tasksByProject: Record<string, ProjectTasksSlice> = {}
      await Promise.all(
        projects.map(async (project) => {
          const tasksResult = await window.koven!.projects.listTasks({
            projectId: project.id,
            offset: 0,
            limit: PROJECTS_PAGE_SIZE
          })
          if (tasksResult.ok) {
            tasksByProject[project.id] = {
              tasks: tasksResult.value.tasks,
              hasMore: tasksResult.value.hasMore,
              loading: false
            }
          } else {
            tasksByProject[project.id] = emptySlice()
          }
        })
      )
      const firstId = projects[0]?.id
      set({
        projects,
        tasksByProject,
        expandedIds: firstId ? new Set([firstId]) : new Set(),
        hydrated: true
      })
    } catch {
      set({ hydrated: true })
    }
  },

  setExpanded: (projectId, expanded) => {
    set((state) => {
      const next = new Set(state.expandedIds)
      if (expanded) next.add(projectId)
      else next.delete(projectId)
      return { expandedIds: next }
    })
  },

  toggleExpanded: (projectId) => {
    const expanded = !get().expandedIds.has(projectId)
    get().setExpanded(projectId, expanded)
    if (expanded) void get().ensureProjectTasks(projectId)
  },

  ensureProjectTasks: async (projectId) => {
    const existing = get().tasksByProject[projectId]
    if (existing && (existing.tasks.length > 0 || existing.loading)) return
    if (!window.koven?.projects) return
    set((state) => ({
      tasksByProject: {
        ...state.tasksByProject,
        [projectId]: { ...(existing ?? emptySlice()), loading: true }
      }
    }))
    const result = await window.koven.projects.listTasks({
      projectId,
      offset: 0,
      limit: PROJECTS_PAGE_SIZE
    })
    set((state) => ({
      tasksByProject: {
        ...state.tasksByProject,
        [projectId]: result.ok
          ? {
              tasks: result.value.tasks,
              hasMore: result.value.hasMore,
              loading: false
            }
          : { ...(state.tasksByProject[projectId] ?? emptySlice()), loading: false }
      }
    }))
  },

  loadMoreTasks: async (projectId) => {
    const slice = get().tasksByProject[projectId] ?? emptySlice()
    if (!slice.hasMore || slice.loading || !window.koven?.projects) return
    set((state) => ({
      tasksByProject: {
        ...state.tasksByProject,
        [projectId]: { ...slice, loading: true }
      }
    }))
    const result = await window.koven.projects.listTasks({
      projectId,
      offset: slice.tasks.length,
      limit: PROJECTS_PAGE_SIZE
    })
    set((state) => {
      const current = state.tasksByProject[projectId] ?? emptySlice()
      if (!result.ok) {
        return {
          tasksByProject: {
            ...state.tasksByProject,
            [projectId]: { ...current, loading: false }
          }
        }
      }
      const merged = sortTasks([...current.tasks, ...result.value.tasks])
      const deduped = Array.from(new Map(merged.map((t) => [t.id, t])).values())
      return {
        tasksByProject: {
          ...state.tasksByProject,
          [projectId]: {
            tasks: sortTasks(deduped),
            hasMore: result.value.hasMore,
            loading: false
          }
        }
      }
    })
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  runSearch: async (query, append = false) => {
    const trimmed = query.trim()
    if (!trimmed) {
      set({
        searchHits: [],
        searchHasMore: false,
        searchLoading: false,
        searchOffset: 0
      })
      return
    }
    if (!window.koven?.projects) return
    const offset = append ? get().searchOffset : 0
    set({ searchLoading: true, searchQuery: query })
    const result = await window.koven.projects.search({
      query: trimmed,
      offset,
      limit: PROJECTS_PAGE_SIZE
    })
    set((state) => {
      if (!result.ok) {
        return { searchLoading: false }
      }
      const hits = append ? [...state.searchHits, ...result.value.hits] : result.value.hits
      const projectIds = new Set(
        hits.map((hit) => (hit.kind === 'project' ? hit.project.id : hit.project.id))
      )
      const expandedIds = new Set(state.expandedIds)
      for (const id of projectIds) expandedIds.add(id)
      return {
        searchHits: hits,
        searchHasMore: result.value.hasMore,
        searchLoading: false,
        searchOffset: offset + result.value.hits.length,
        expandedIds
      }
    })
  },

  loadMoreSearch: async () => {
    const { searchQuery, searchHasMore, searchLoading } = get()
    if (!searchHasMore || searchLoading) return
    await get().runSearch(searchQuery, true)
  },

  upsertProjectAndTask: (project, task) => {
    set((state) => {
      const projects = state.projects.some((p) => p.id === project.id)
        ? state.projects.map((p) => (p.id === project.id ? project : p))
        : [...state.projects, project].sort((a, b) => a.sortOrder - b.sortOrder)
      const slice = state.tasksByProject[project.id] ?? emptySlice()
      const without = slice.tasks.filter((t) => t.id !== task.id)
      const tasks = sortTasks([task, ...without])
      const expandedIds = new Set(state.expandedIds)
      expandedIds.add(project.id)
      return {
        projects,
        tasksByProject: {
          ...state.tasksByProject,
          [project.id]: { ...slice, tasks, hasMore: slice.hasMore }
        },
        expandedIds
      }
    })
  },

  upsertTask: (task) => {
    set((state) => {
      const slice = state.tasksByProject[task.projectId] ?? emptySlice()
      const without = slice.tasks.filter((t) => t.id !== task.id)
      return {
        tasksByProject: {
          ...state.tasksByProject,
          [task.projectId]: {
            ...slice,
            tasks: sortTasks([task, ...without])
          }
        }
      }
    })
  },

  patchTask: (taskId, patch) => {
    set((state) => {
      const tasksByProject = { ...state.tasksByProject }
      for (const [projectId, slice] of Object.entries(tasksByProject)) {
        const index = slice.tasks.findIndex((t) => t.id === taskId)
        if (index < 0) continue
        const nextTasks = [...slice.tasks]
        const current = nextTasks[index]!
        nextTasks[index] = { ...current, ...patch }
        tasksByProject[projectId] = {
          ...slice,
          tasks: sortTasks(nextTasks)
        }
        break
      }
      return { tasksByProject }
    })
  },

  removeTask: (taskId) => {
    set((state) => {
      const tasksByProject = { ...state.tasksByProject }
      for (const [projectId, slice] of Object.entries(tasksByProject)) {
        if (!slice.tasks.some((t) => t.id === taskId)) continue
        tasksByProject[projectId] = {
          ...slice,
          tasks: slice.tasks.filter((t) => t.id !== taskId)
        }
        break
      }
      return {
        tasksByProject,
        searchHits: state.searchHits.filter(
          (hit) => !(hit.kind === 'task' && hit.task.id === taskId)
        )
      }
    })
  },

  removeProject: (projectId) => {
    set((state) => {
      const { [projectId]: _removed, ...tasksByProject } = state.tasksByProject
      const expandedIds = new Set(state.expandedIds)
      expandedIds.delete(projectId)
      return {
        projects: state.projects.filter((project) => project.id !== projectId),
        tasksByProject,
        expandedIds,
        searchHits: state.searchHits.filter((hit) => hit.project.id !== projectId)
      }
    })
  },

  getTaskById: (taskId) => {
    for (const slice of Object.values(get().tasksByProject)) {
      const found = slice.tasks.find((t) => t.id === taskId)
      if (found) return found
    }
    for (const hit of get().searchHits) {
      if (hit.kind === 'task' && hit.task.id === taskId) return hit.task
    }
    return undefined
  },

  getProjectById: (projectId) => get().projects.find((p) => p.id === projectId),

  listSelectableTaskPageIds: () => {
    const ids = new Set<string>()
    for (const slice of Object.values(get().tasksByProject)) {
      for (const task of slice.tasks) {
        ids.add(toTaskPageId(task.id))
      }
    }
    for (const hit of get().searchHits) {
      if (hit.kind === 'task') ids.add(toTaskPageId(hit.task.id))
    }
    return ids
  }
}))

export function taskStatusLabelKey(status: TaskStatus): string {
  switch (status) {
    case 'loading':
      return 'nav.statusInProgress'
    case 'finished':
      return 'nav.statusDone'
    case 'error':
      return 'nav.statusFailed'
    default:
      return ''
  }
}
