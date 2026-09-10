import { AboutDialog } from '@renderer/capabilities/app-info/about-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { ThemeSegment } from '@renderer/components/ui/theme-segment'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { ChevronsUpDownIcon, SettingsIcon } from 'lucide-react'
import { useState } from 'react'

export function SidebarFooter() {
  const open = useNavigationStore((state) => state.open)
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <div className="shrink-0 border-t border-border p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <SettingsIcon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">系统设置</span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <div
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
            onPointerDown={(event) => event.preventDefault()}
          >
            <span className="text-sm text-foreground">主题</span>
            <ThemeSegment />
          </div>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => open('preferences')}>首选项</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAboutOpen(true)}>关于</DropdownMenuItem>
            <DropdownMenuItem disabled>检查更新</DropdownMenuItem>
            <DropdownMenuItem disabled>帮助</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  )
}
