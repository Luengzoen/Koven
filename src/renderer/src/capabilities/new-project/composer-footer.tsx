import { WorkspacePickerButton } from '@renderer/capabilities/new-project/workspace-picker'
import { useT } from '@renderer/shell/use-t'
import { BadgeCheckIcon, ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

/** Prompt 底栏：工作空间选择 / 权限（权限稍后接） */
export function ComposerFooter() {
  const t = useT()
  const [workspacePath, setWorkspacePath] = useState<string | null>(null)

  return (
    <div className="flex shrink-0 items-center gap-4 border-t border-border bg-muted/50 px-3 py-2">
      <WorkspacePickerButton value={workspacePath} onChange={setWorkspacePath} />

      <button
        type="button"
        className="inline-flex max-w-[50%] cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground"
        aria-label={t('newProject.defaultPermissions')}
      >
        <BadgeCheckIcon className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">{t('newProject.defaultPermissions')}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-80" />
      </button>
    </div>
  )
}
