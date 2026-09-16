import { cn } from '@renderer/lib/cn'
import { ChevronRightIcon, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

type CollapsibleChromeProps = {
  icon: LucideIcon
  title: string
  statusText: string
  /** 未手动切换时：running 展开，done 折叠 */
  status: 'running' | 'done'
  children?: ReactNode
  className?: string
}

export function CollapsibleChrome({
  icon: Icon,
  title,
  statusText,
  status,
  children,
  className
}: CollapsibleChromeProps) {
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null)
  const collapsed = userCollapsed ?? status === 'done'

  return (
    <div className={cn('w-full rounded-lg border border-border bg-card/40', className)}>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-foreground"
        aria-expanded={!collapsed}
        onClick={() => setUserCollapsed(!collapsed)}
      >
        <ChevronRightIcon
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            !collapsed && 'rotate-90'
          )}
          aria-hidden
        />
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 truncate font-medium">{title}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{statusText}</span>
      </button>
      {!collapsed && children ? (
        <div className="border-t border-border px-3 py-2 text-sm text-foreground">{children}</div>
      ) : null}
    </div>
  )
}
