import { getPage, homePage } from '@renderer/routes'
import { createNavigationStore } from '@renderer/shell/create-navigation-store'

type NavigationStore = ReturnType<typeof createNavigationStore>

const hot = import.meta.hot
const hotData = hot?.data as { navigationStore?: NavigationStore } | undefined

/** HMR 时复用同一 store，避免侧栏与主区各绑一份状态、点导航页不动 */
const navigationStore =
  hotData?.navigationStore ?? createNavigationStore(homePage.id)

if (hot) {
  hot.data.navigationStore = navigationStore
  hot.accept()
}

export const useNavigationStore = navigationStore

export function useActivePage() {
  const activeId = useNavigationStore((state) => state.activeId)
  return getPage(activeId) ?? homePage
}
