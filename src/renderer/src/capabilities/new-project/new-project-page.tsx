import { PromptComposer } from '@renderer/capabilities/new-project/prompt-composer'
import { useProjectsStore } from '@renderer/capabilities/projects/projects-store'
import { useTaskChatStore } from '@renderer/capabilities/task-chat/task-chat-store'
import { useDraftStore } from '@renderer/shell/draft-store'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { useT } from '@renderer/shell/use-t'
import { toTaskPageId } from '@shared/capabilities/projects'
import { useState } from 'react'
import { cn } from '@renderer/lib/cn'

export function NewProjectPage() {
  const t = useT()
  const projectId = useDraftStore((state) => state.projectId)
  const clearDraft = useDraftStore((state) => state.clear)
  const openFromSidebar = useNavigationStore((state) => state.openFromSidebar)
  const upsertProjectAndTask = useProjectsStore((state) => state.upsertProjectAndTask)
  const upsertTask = useProjectsStore((state) => state.upsertTask)
  const queueBootstrap = useTaskChatStore((state) => state.queueBootstrap)
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const inProject = Boolean(projectId)

  async function handleSend(text: string) {
    if (!window.koven?.projects || submitting) return
    setSubmitting(true)
    setLeaving(true)

    try {
      if (projectId) {
        const result = await window.koven.projects.createTask({ projectId, title: text })
        if (!result.ok) {
          setLeaving(false)
          setSubmitting(false)
          return
        }
        upsertTask(result.value)
        queueBootstrap(result.value.id, text)
        window.setTimeout(() => {
          openFromSidebar(toTaskPageId(result.value.id))
          clearDraft()
        }, 280)
        return
      }

      if (!projectPath) {
        setLeaving(false)
        setSubmitting(false)
        return
      }

      const result = await window.koven.projects.createProjectWithTask({
        projectPath,
        title: text
      })
      if (!result.ok) {
        setLeaving(false)
        setSubmitting(false)
        return
      }
      upsertProjectAndTask(result.value.project, result.value.task)
      queueBootstrap(result.value.task.id, text)
      window.setTimeout(() => {
        openFromSidebar(toTaskPageId(result.value.task.id))
        clearDraft()
      }, 280)
    } catch {
      setLeaving(false)
      setSubmitting(false)
    }
  }

  return (
    <section
      className="flex h-full min-h-0 items-center justify-center bg-background px-6"
      aria-label={t('nav.newProject')}
    >
      <div
        className={cn(
          'flex w-full max-w-xl flex-col items-center gap-6 transition-all duration-300 ease-out',
          leaving && 'translate-y-8 opacity-0'
        )}
      >
        <h1
          className={cn(
            'text-center text-3xl font-semibold tracking-tight text-foreground transition-opacity duration-300',
            leaving && 'opacity-0'
          )}
        >
          {t('newProject.heroTitle')}
        </h1>
        <PromptComposer
          layout="hero"
          showProjectDirectory={!inProject}
          requireProjectDirectory={!inProject}
          projectPath={projectPath}
          onProjectPathChange={setProjectPath}
          busy={submitting}
          onSend={handleSend}
        />
      </div>
    </section>
  )
}
