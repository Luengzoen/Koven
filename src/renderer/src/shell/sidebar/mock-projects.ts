export type TaskStatus = 'loading' | 'done' | 'error' | null

export type SidebarTask = {
  id: string
  pageId: string
  title: string
  status: TaskStatus
}

export type SidebarProject = {
  id: string
  title: string
  tasks: readonly SidebarTask[]
}

/** 演示用占位数据，后续接主进程持久化 */
export const mockProjects: readonly SidebarProject[] = [
  {
    id: 'project-alpha',
    title: '示例项目',
    tasks: [
      {
        id: 'task-demo-1',
        pageId: 'task:demo-1',
        title: '整理需求说明',
        status: 'loading'
      },
      {
        id: 'task-demo-2',
        pageId: 'task:demo-2',
        title: '核对发布清单',
        status: 'done'
      }
    ]
  },
  {
    id: 'project-beta',
    title: '另一项目',
    tasks: [
      {
        id: 'task-demo-3',
        pageId: 'task:demo-3',
        title: '回顾上周进度',
        status: null
      }
    ]
  }
]
