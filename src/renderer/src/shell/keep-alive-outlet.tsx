import { getPage } from '@renderer/routes'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { cn } from '@renderer/lib/cn'

export function KeepAliveOutlet() {
  const activeId = useNavigationStore((state) => state.activeId)
  const visitedIds = useNavigationStore((state) => state.visitedIds)

  return (
    <div className="relative min-h-0 flex-1">
      {visitedIds.map((id) => {
        const entry = getPage(id)
        if (!entry) return null
        const { Page } = entry
        const active = id === activeId
        return (
          <div
            key={id}
            className={cn(
              'absolute inset-0 overflow-auto',
              active ? 'z-10' : 'pointer-events-none hidden'
            )}
            aria-hidden={!active}
          >
            <Page />
          </div>
        )
      })}
    </div>
  )
}
