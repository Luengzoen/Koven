import { PromptComposer } from '@renderer/capabilities/new-project/prompt-composer'
import { useT } from '@renderer/shell/use-t'

export function NewProjectPage() {
  const t = useT()

  return (
    <section
      className="flex h-full min-h-0 items-center justify-center bg-background px-6"
      aria-label={t('nav.newProject')}
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground">
          {t('newProject.heroTitle')}
        </h1>
        <PromptComposer />
      </div>
    </section>
  )
}
