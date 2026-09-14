import { create } from 'zustand'
import type { ChatMessage } from '@renderer/capabilities/task-chat/mock-stream'
import {
  createAssistantPlaceholder,
  createUserMessage,
  mockStreamAssistant
} from '@renderer/capabilities/task-chat/mock-stream'
import { useProjectsStore } from '@renderer/capabilities/projects/projects-store'
import { playTaskCompleteSoundIfBadgeWouldShow } from '@renderer/shell/play-task-complete-sound'

type TaskChatSlice = {
  messages: ChatMessage[]
  busy: boolean
  bootstrapped: boolean
}

type TaskChatState = {
  byTaskId: Record<string, TaskChatSlice>
  pendingPrompts: Record<string, string>
  ensureTask: (taskId: string) => void
  queueBootstrap: (taskId: string, prompt: string) => void
  consumeBootstrap: (taskId: string) => Promise<void>
  send: (taskId: string, text: string) => Promise<void>
  isBusy: (taskId: string) => boolean
  getMessages: (taskId: string) => ChatMessage[]
}

function emptySlice(): TaskChatSlice {
  return { messages: [], busy: false, bootstrapped: false }
}

export const useTaskChatStore = create<TaskChatState>((set, get) => ({
  byTaskId: {},
  pendingPrompts: {},

  ensureTask: (taskId) => {
    if (get().byTaskId[taskId]) return
    set((state) => ({
      byTaskId: { ...state.byTaskId, [taskId]: emptySlice() }
    }))
  },

  isBusy: (taskId) => get().byTaskId[taskId]?.busy ?? false,

  getMessages: (taskId) => get().byTaskId[taskId]?.messages ?? [],

  queueBootstrap: (taskId, prompt) => {
    set((state) => ({
      pendingPrompts: { ...state.pendingPrompts, [taskId]: prompt }
    }))
  },

  consumeBootstrap: async (taskId) => {
    const prompt = get().pendingPrompts[taskId]
    if (!prompt) return
    get().ensureTask(taskId)
    const slice = get().byTaskId[taskId] ?? emptySlice()
    if (slice.bootstrapped || slice.busy) {
      set((state) => {
        const { [taskId]: _removed, ...rest } = state.pendingPrompts
        return { pendingPrompts: rest }
      })
      return
    }
    set((state) => {
      const { [taskId]: _removed, ...rest } = state.pendingPrompts
      return { pendingPrompts: rest }
    })
    await get().send(taskId, prompt)
    set((state) => ({
      byTaskId: {
        ...state.byTaskId,
        [taskId]: {
          ...(state.byTaskId[taskId] ?? emptySlice()),
          bootstrapped: true
        }
      }
    }))
  },

  send: async (taskId, text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    get().ensureTask(taskId)
    if (get().byTaskId[taskId]?.busy) return

    const userMessage = createUserMessage(trimmed)
    const assistant = createAssistantPlaceholder()
    set((state) => {
      const slice = state.byTaskId[taskId] ?? emptySlice()
      return {
        byTaskId: {
          ...state.byTaskId,
          [taskId]: {
            ...slice,
            busy: true,
            messages: [...slice.messages, userMessage, assistant]
          }
        }
      }
    })

    void window.koven?.projects.updateTaskStatus({ taskId, status: 'loading' })
    void window.koven?.projects.touchTaskChat(taskId)
    useProjectsStore.getState().patchTask(taskId, {
      status: 'loading',
      lastChatAt: Date.now()
    })

    const signal = { cancelled: false }
    try {
      await mockStreamAssistant({
        signal,
        onThinking: (thinking) => {
          set((state) => {
            const slice = state.byTaskId[taskId] ?? emptySlice()
            const messages = slice.messages.map((msg) =>
              msg.id === assistant.id ? { ...msg, thinking } : msg
            )
            return { byTaskId: { ...state.byTaskId, [taskId]: { ...slice, messages } } }
          })
        },
        onBody: (content) => {
          set((state) => {
            const slice = state.byTaskId[taskId] ?? emptySlice()
            const messages = slice.messages.map((msg) =>
              msg.id === assistant.id ? { ...msg, content } : msg
            )
            return { byTaskId: { ...state.byTaskId, [taskId]: { ...slice, messages } } }
          })
        }
      })
      set((state) => {
        const slice = state.byTaskId[taskId] ?? emptySlice()
        const messages = slice.messages.map((msg) =>
          msg.id === assistant.id ? { ...msg, streaming: false } : msg
        )
        return {
          byTaskId: {
            ...state.byTaskId,
            [taskId]: { ...slice, messages, busy: false }
          }
        }
      })
      void window.koven?.projects.updateTaskStatus({ taskId, status: 'finished' })
      useProjectsStore.getState().patchTask(taskId, { status: 'finished' })
      playTaskCompleteSoundIfBadgeWouldShow(taskId)
    } catch {
      set((state) => {
        const slice = state.byTaskId[taskId] ?? emptySlice()
        return {
          byTaskId: {
            ...state.byTaskId,
            [taskId]: { ...slice, busy: false }
          }
        }
      })
      void window.koven?.projects.updateTaskStatus({ taskId, status: 'error' })
      useProjectsStore.getState().patchTask(taskId, { status: 'error' })
    }
  }
}))
