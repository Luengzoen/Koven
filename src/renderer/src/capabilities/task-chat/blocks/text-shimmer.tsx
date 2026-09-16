import { cn } from '@renderer/lib/cn'
import type { ReactNode } from 'react'

type TextShimmerProps = {
  children: ReactNode
  active: boolean
  className?: string
}

/** 运行中文本横向流光；完成后恢复常态 */
export function TextShimmer({ children, active, className }: TextShimmerProps) {
  if (!active) {
    return <span className={className}>{children}</span>
  }
  return <span className={cn('koven-text-shimmer', className)}>{children}</span>
}
