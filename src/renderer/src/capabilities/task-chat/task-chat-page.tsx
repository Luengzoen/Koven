import { PromptComposer } from '@renderer/capabilities/new-project/prompt-composer'
import { useTaskChatStore } from '@renderer/capabilities/task-chat/task-chat-store'
import { useProjectsStore } from '@renderer/capabilities/projects/projects-store'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { useT } from '@renderer/shell/use-t'
import { toTaskPageId } from '@shared/capabilities/projects'
import { useEffect } from 'react'

type TaskChatPageProps = {
  taskId: string
}

function dismissBadgeIfNeeded(taskId: string): void {
  const task = useProjectsStore.getState().getTaskById(taskId)
  if (!task) return
  if (task.status !== 'finished' && task.status !== 'error') return
  useProjectsStore.getState().patchTask(taskId, { status: 'idle' })
  void window.koven?.projects.updateTaskStatus({ taskId, status: 'idle' })
}

export function TaskChatPage({ taskId }: TaskChatPageProps) {
  const t = useT()
  const pageId = toTaskPageId(taskId)
  const activeId = useNavigationStore((state) => state.activeId)
  const title = useProjectsStore((state) => state.getTaskById(taskId)?.title ?? '')
  const status = useProjectsStore((state) => state.getTaskById(taskId)?.status)
  const messages = useTaskChatStore((state) => state.byTaskId[taskId]?.messages ?? [])
  const busy = useTaskChatStore((state) => state.byTaskId[taskId]?.busy ?? false)
  const ensureTask = useTaskChatStore((state) => state.ensureTask)
  const consumeBootstrap = useTaskChatStore((state) => state.consumeBootstrap)
  const send = useTaskChatStore((state) => state.send)

  useEffect(() => {
    ensureTask(taskId)
    void consumeBootstrap(taskId)
  }, [consumeBootstrap, ensureTask, taskId])

  // 当前任务页：finished/error badge 阅后即焚 → idle；loading 保留
  useEffect(() => {
    if (activeId !== pageId) return
    dismissBadgeIfNeeded(taskId)
  }, [activeId, pageId, taskId, status])

  return (
    <section
      className="flex h-full min-h-0 flex-col bg-background"
      aria-label={title || t('nav.newProject')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-2xl bg-muted px-4 py-3 text-sm text-foreground'
                  : 'mr-auto max-w-[85%] space-y-2 text-sm text-foreground'
              }
            >
              {message.role === 'assistant' && message.thinking ? (
                <p className="rounded-lg border border-border bg-card/60 px-3 py-2 text-muted-foreground">
                  {message.thinking}
                </p>
              ) : null}
              {message.content ? (
                <p className="whitespace-pre-wrap leading-6">{message.content}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-6 py-4">
        <div className="mx-auto w-full max-w-3xl">
          <PromptComposer
            layout="docked"
            showWorkspace={false}
            busy={busy}
            onSend={(text) => {
              void send(taskId, text)
            }}
          />
        </div>
      </div>
    </section>
  )
}
