import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import {
  Popover,
  PopoverAnchor,
  PopoverContent
} from '@renderer/components/ui/popover'
import { Button } from '@renderer/components/ui/button'
import { useT } from '@renderer/shell/use-t'
import { type ReactElement, useRef, useState } from 'react'

type TaskRowMenuProps = {
  trigger: ReactElement
  onRename: () => void
  onArchive: () => void
  onDelete: () => void
}

/** 等菜单 dismiss / 指针收尾后再动作，避免气泡或重命名被立刻关掉 */
function afterMenuClose(action: () => void): void {
  window.setTimeout(action, 120)
}

export function TaskRowMenu({
  trigger,
  onRename,
  onArchive,
  onDelete
}: TaskRowMenuProps) {
  const t = useT()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirm, setConfirm] = useState<'archive' | 'delete' | null>(null)
  const guardOutsideUntil = useRef(0)

  const openConfirm = (kind: 'archive' | 'delete'): void => {
    guardOutsideUntil.current = Date.now() + 250
    setConfirm(kind)
  }

  const guardOutside = (event: Event): void => {
    if (Date.now() < guardOutsideUntil.current) {
      event.preventDefault()
    }
  }

  return (
    <Popover
      open={confirm != null}
      onOpenChange={(open) => {
        if (!open) setConfirm(null)
      }}
    >
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverAnchor asChild>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        </PopoverAnchor>
        <DropdownMenuContent
          side="bottom"
          align="end"
          className="min-w-32"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setMenuOpen(false)
              afterMenuClose(onRename)
            }}
          >
            {t('nav.renameTask')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setMenuOpen(false)
              afterMenuClose(() => openConfirm('archive'))
            }}
          >
            {t('nav.archiveTask')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setMenuOpen(false)
              afterMenuClose(() => openConfirm('delete'))
            }}
          >
            {t('nav.deleteTask')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PopoverContent
        side="bottom"
        align="end"
        className="w-56 p-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerDownOutside={guardOutside}
        onFocusOutside={guardOutside}
        onInteractOutside={guardOutside}
      >
        <p className="text-sm text-foreground">
          {confirm === 'archive' ? t('nav.archiveTaskConfirm') : t('nav.deleteTaskConfirm')}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              if (confirm === 'archive') onArchive()
              if (confirm === 'delete') onDelete()
              setConfirm(null)
            }}
          >
            {t('common.ok')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
