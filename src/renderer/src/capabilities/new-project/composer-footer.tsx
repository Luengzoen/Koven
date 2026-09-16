import { ProjectPickerButton } from '@renderer/capabilities/new-project/project-picker'
import { useT } from '@renderer/shell/use-t'
import { BadgeCheckIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@renderer/lib/cn'

type ComposerFooterProps = {
  projectPath: string | null
  onProjectPathChange: (path: string | null) => void
  showProjectDirectory: boolean
  disabled?: boolean
}

/** Prompt 底栏：项目目录选择 / 权限（权限稍后接） */
export function ComposerFooter({
  projectPath,
  onProjectPathChange,
  showProjectDirectory,
  disabled = false
}: ComposerFooterProps) {
  const t = useT()

  return (
    <div className="flex shrink-0 items-center gap-4 border-t border-border bg-muted/50 px-3 py-2">
      {showProjectDirectory ? (
        <ProjectPickerButton
          value={projectPath}
          onChange={onProjectPathChange}
          disabled={disabled}
        />
      ) : null}

      <button
        type="button"
        disabled={disabled}
        className={cn(
          'inline-flex max-w-[50%] cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted-foreground outline-none transition-colors',
          'hover:bg-accent hover:text-foreground',
          'disabled:pointer-events-none disabled:opacity-50'
        )}
        aria-label={t('newProject.defaultPermissions')}
      >
        <BadgeCheckIcon className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">{t('newProject.defaultPermissions')}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-80" />
      </button>
    </div>
  )
}
