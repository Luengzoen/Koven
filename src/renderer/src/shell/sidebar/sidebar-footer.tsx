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
import { useT } from '@renderer/shell/use-t'
import { ChevronsUpDownIcon, SettingsIcon } from 'lucide-react'
import { useState } from 'react'

export function SidebarFooter() {
  const open = useNavigationStore((state) => state.open)
  const [aboutOpen, setAboutOpen] = useState(false)
  const t = useT()

  return (
    <div className="shrink-0 border-t border-border p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <SettingsIcon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{t('nav.systemSettings')}</span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <div
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
            onPointerDown={(event) => event.preventDefault()}
          >
            <span className="text-sm text-foreground">{t('nav.theme')}</span>
            <ThemeSegment />
          </div>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => open('preferences')}>
              {t('nav.preferences')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
              {t('nav.about')}
            </DropdownMenuItem>
            <DropdownMenuItem disabled>{t('nav.checkUpdates')}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t('nav.help')}</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  )
}
