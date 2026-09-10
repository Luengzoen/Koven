import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { ChevronsUpDownIcon, SettingsIcon } from 'lucide-react'

const placeholderItems = ['关于 Koven', '检查更新', '帮助'] as const

export function SidebarFooter() {
  return (
    <div className="shrink-0 border-t border-zinc-800 p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-zinc-300 outline-none transition-colors hover:bg-zinc-900 hover:text-zinc-50"
          >
            <SettingsIcon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">系统设置</span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-zinc-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-52">
          <DropdownMenuGroup>
            {placeholderItems.map((label) => (
              <DropdownMenuItem key={label}>{label}</DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
