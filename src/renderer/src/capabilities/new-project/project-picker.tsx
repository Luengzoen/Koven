import { FileBrowser } from '@renderer/components/fs-browser/file-browser'
import { Button } from '@renderer/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@renderer/components/ui/popover'
import { useT } from '@renderer/shell/use-t'
import type { FsBrowserListEntry } from '@shared/capabilities/fs-browser'
import { ChevronDownIcon, FolderIcon, XIcon } from 'lucide-react'
import { useState, type MouseEvent, type PointerEvent } from 'react'

type ProjectPickerProps = {
  value: string | null
  onChange: (path: string | null) => void
  disabled?: boolean
}

export function ProjectPickerButton({
  value,
  onChange,
  disabled = false
}: ProjectPickerProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<FsBrowserListEntry[]>([])

  const label = value
    ? value.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || value
    : t('newProject.selectProjectDirectory')

  function handleOpenChange(next: boolean) {
    if (disabled) return
    setOpen(next)
    if (next) {
      setDraft(
        value
          ? [
              {
                path: value,
                name: label,
                kind: 'directory',
                extension: '',
                isHidden: false,
                isSystem: false
              }
            ]
          : []
      )
    }
  }

  async function handleConfirm() {
    const selected = draft[0]
    if (!selected) return
    onChange(selected.path)
    setOpen(false)
  }

  function handleClear(event: MouseEvent | PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    onChange(null)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="group inline-flex max-w-[50%] cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          aria-label={t('newProject.selectProjectDirectory')}
        >
          <FolderIcon className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate">{label}</span>
          {value ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label={t('common.clear')}
              className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-border hover:text-foreground"
              onPointerDown={handleClear}
              onClick={handleClear}
            >
              <XIcon className="size-3" />
            </span>
          ) : null}
          <ChevronDownIcon className="size-3.5 shrink-0 opacity-80 transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-[min(720px,calc(100vw-2rem))] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex flex-col gap-0">
          {/*
            Content 关闭动画期间仍会挂着：勿用 open 条件拆掉 FileBrowser，
            否则上半截瞬空、只剩底栏在播收回。整层随 Content 卸挂即可重挂。
          */}
          <FileBrowser
            key={value ?? '__empty__'}
            title={t('newProject.projectDirectoryPickerTitle')}
            mode="directory"
            maxCount={1}
            showDetail
            height={380}
            className="rounded-none border-0"
            value={draft.map((entry) => entry.path)}
            initialPath={value ?? undefined}
            onChange={setDraft}
            onConfirm={async (selection) => {
              setDraft(selection)
              if (selection[0]) {
                onChange(selection[0].path)
                setOpen(false)
              }
            }}
            onCancel={() => setOpen(false)}
          />
          <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={draft.length === 0}
              onClick={() => void handleConfirm()}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
