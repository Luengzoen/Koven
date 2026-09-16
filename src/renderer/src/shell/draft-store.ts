import { create } from 'zustand'

type DraftState = {
  /** 非空时表示「项目加号」进草稿：隐藏项目目录选择，发送只建任务 */
  projectId: string | null
  openNewProject: () => void
  openInProject: (projectId: string) => void
  clear: () => void
}

export const useDraftStore = create<DraftState>((set) => ({
  projectId: null,
  openNewProject: () => set({ projectId: null }),
  openInProject: (projectId) => set({ projectId }),
  clear: () => set({ projectId: null })
}))
