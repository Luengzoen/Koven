import { getPage, resolvePageTitle } from '@renderer/routes'
import { useActivePage, useNavigationStore } from '@renderer/shell/navigation-store'
import { useShellLayoutStore } from '@renderer/shell/shell-layout-store'
import { useLocale, useT } from '@renderer/shell/use-t'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { ChevronLeftIcon, PanelLeftIcon } from 'lucide-react'

export function PageTopbar() {
  const page = useActivePage()
  const backStack = useNavigationStore((state) => state.backStack)
  const back = useNavigationStore((state) => state.back)
  const sidebarOpen = useShellLayoutStore((state) => state.sidebarOpen)
  const toggleSidebar = useShellLayoutStore((state) => state.toggleSidebar)
  const t = useT()
  const locale = useLocale()

  const showBack = page.chrome?.showBack === true
  const previousId = backStack[backStack.length - 1]
  const previousTitle = previousId
    ? resolvePageTitle(getPage(previousId), locale)
    : undefined
  const pageTitle = resolvePageTitle(page, locale)
  const sidebarTooltip = sidebarOpen
    ? t('nav.collapseSidebar')
    : t('nav.expandSidebar')

  return (
    <div className="relative flex h-10 shrink-0 items-center border-b border-border px-2">
      <div className="z-10 flex min-w-0 items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={sidebarTooltip}
              aria-pressed={sidebarOpen}
              onClick={toggleSidebar}
              className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-4"
            >
              <PanelLeftIcon />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{sidebarTooltip}</TooltipContent>
        </Tooltip>

        {showBack ? (
          <button
            type="button"
            onClick={back}
            aria-label={
              previousTitle ? t('nav.backTo', { title: previousTitle }) : t('nav.back')
            }
            className="inline-flex h-8 max-w-[7.5rem] min-w-0 shrink cursor-pointer items-center gap-0.5 overflow-hidden rounded-md px-1 text-sm text-foreground outline-none transition-colors hover:bg-accent [&_svg]:size-4"
          >
            <ChevronLeftIcon className="shrink-0" />
            {previousTitle ? (
              <span className="min-w-0 flex-1 truncate font-medium">{previousTitle}</span>
            ) : null}
          </button>
        ) : null}
      </div>

      <h1 className="pointer-events-none absolute inset-x-0 truncate px-28 text-center text-sm font-semibold text-foreground">
        {pageTitle}
      </h1>
    </div>
  )
}
