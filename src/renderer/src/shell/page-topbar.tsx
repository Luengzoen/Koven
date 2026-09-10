import { useShellLayoutStore } from '@renderer/shell/shell-layout-store'
import { PanelLeftIcon } from 'lucide-react'

export function PageTopbar() {
  const sidebarOpen = useShellLayoutStore((state) => state.sidebarOpen)
  const toggleSidebar = useShellLayoutStore((state) => state.toggleSidebar)

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border px-2">
      <button
        type="button"
        aria-label={sidebarOpen ? '收起侧栏' : '展开侧栏'}
        aria-pressed={sidebarOpen}
        onClick={toggleSidebar}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-4"
      >
        <PanelLeftIcon />
      </button>
    </div>
  )
}
