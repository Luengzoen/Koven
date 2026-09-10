import { useShellLayoutStore } from '@renderer/shell/shell-layout-store'
import { PanelLeftIcon } from 'lucide-react'

export function PageTopbar() {
  const sidebarOpen = useShellLayoutStore((state) => state.sidebarOpen)
  const toggleSidebar = useShellLayoutStore((state) => state.toggleSidebar)

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-zinc-800 px-2">
      <button
        type="button"
        aria-label={sidebarOpen ? '收起侧栏' : '展开侧栏'}
        aria-pressed={sidebarOpen}
        onClick={toggleSidebar}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-zinc-400 outline-none transition-colors hover:bg-zinc-800 hover:text-zinc-100 [&_svg]:size-4"
      >
        <PanelLeftIcon />
      </button>
    </div>
  )
}
