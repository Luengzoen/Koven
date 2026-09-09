import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@renderer/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { InfoIcon, MoreHorizontalIcon } from 'lucide-react'
import { useState } from 'react'

export function AboutMenu() {
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="更多">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
              <InfoIcon />
              关于
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogTitle>关于 Koven</DialogTitle>
        <DialogDescription>
          渲染进程没有 Node 权限。主进程能力只通过 preload 的 contextBridge
          暴露，符合当前 Electron 安全模型。
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}
