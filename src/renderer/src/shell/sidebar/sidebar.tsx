import { OverviewNav } from '@renderer/shell/sidebar/overview-nav'
import { ProjectsTree } from '@renderer/shell/sidebar/projects-tree'
import { SidebarFooter } from '@renderer/shell/sidebar/sidebar-footer'
import { SidebarSearch } from '@renderer/shell/sidebar/sidebar-search'
import { useShellLayoutStore } from '@renderer/shell/shell-layout-store'
import { cn } from '@renderer/lib/cn'

type SidebarProps = {
  resizing: boolean
}

export function Sidebar({ resizing }: SidebarProps) {
  const sidebarOpen = useShellLayoutStore((state) => state.sidebarOpen)
  const sidebarWidth = useShellLayoutStore((state) => state.sidebarWidth)

  return (
    <div
      style={{ width: sidebarOpen ? sidebarWidth : 0 }}
      className={cn(
        'relative h-full shrink-0 overflow-hidden border-r bg-background',
        sidebarOpen ? 'border-border' : 'border-transparent',
        !resizing && 'transition-[width,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]'
      )}
      aria-hidden={!sidebarOpen}
    >
      <aside
        style={{ width: sidebarWidth }}
        className={cn(
          'flex h-full flex-col pt-2',
          !sidebarOpen && 'pointer-events-none'
        )}
      >
        <OverviewNav />
        <SidebarSearch />
        <ProjectsTree />
        <SidebarFooter />
      </aside>
    </div>
  )
}
