import { getPage, homePage } from '@renderer/routes'
import { createNavigationStore } from '@renderer/shell/create-navigation-store'

export const useNavigationStore = createNavigationStore(homePage.id)

export function useActivePage() {
  const activeId = useNavigationStore((state) => state.activeId)
  return getPage(activeId) ?? homePage
}
