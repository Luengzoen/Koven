import { getPage } from '@renderer/routes'
import { isDraftPageId } from '@renderer/shell/draft-page'
import { useDraftStore } from '@renderer/shell/draft-store'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { cn } from '@renderer/lib/cn'

export function KeepAliveOutlet() {
  const activeId = useNavigationStore((state) => state.activeId)
  const visitedIds = useNavigationStore((state) => state.visitedIds)
  const draftProjectId = useDraftStore((state) => state.projectId)
  const draftActive = isDraftPageId(activeId)
  const draftPage = draftActive ? getPage(activeId) : undefined

  return (
    <div className="relative min-h-0 flex-1">
      {draftPage ? (
        <div
          className="absolute inset-0 overflow-auto"
          // projectId 变化时重挂，避免「新建项目」与「项目加号」互相残留本地状态
          key={`${activeId}:${draftProjectId ?? 'new'}`}
        >
          <draftPage.Page />
        </div>
      ) : null}
      {visitedIds.map((id) => {
        if (isDraftPageId(id)) return null
        const entry = getPage(id)
        if (!entry) return null
        const { Page } = entry
        const active = id === activeId
        return (
          <div
            key={id}
            className={cn(
              'absolute inset-0 overflow-auto',
              !active && 'pointer-events-none hidden'
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
