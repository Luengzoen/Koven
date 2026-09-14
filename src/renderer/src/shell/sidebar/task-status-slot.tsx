import type { TaskStatus } from '@shared/capabilities/projects'
import { useT } from '@renderer/shell/use-t'
import { cn } from '@renderer/lib/cn'
import { LoaderCircleIcon } from 'lucide-react'

export function TaskStatusSlot({ status }: { status: TaskStatus }) {
  const t = useT()

  if (status === 'loading') {
    return (
      <LoaderCircleIcon
        className="size-3.5 shrink-0 animate-spin text-muted-foreground"
        aria-label={t('nav.statusInProgress')}
      />
    )
  }

  if (status === 'finished') {
    return (
      <span
        className={cn(
          'shrink-0 rounded px-1 py-0.5 text-xs leading-none font-medium',
          'bg-muted text-muted-foreground'
        )}
      >
        {t('nav.statusDone')}
      </span>
    )
  }

  if (status === 'error') {
    return (
      <span
        className={cn(
          'shrink-0 rounded px-1 py-0.5 text-xs leading-none font-medium',
          'bg-muted text-muted-foreground'
        )}
      >
        {t('nav.statusFailed')}
      </span>
    )
  }

  return null
}
