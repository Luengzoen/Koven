import { cn } from '@renderer/lib/cn'
import type { CSSProperties, ReactNode } from 'react'

/** 圆角需成对：发丝层是 1px+scale(0.5)，半径要按视觉的 2 倍写 */
const radiusPair = {
  md: { frame: 'rounded-md', hairline: 'rounded-[12px]' },
  lg: { frame: 'rounded-lg', hairline: 'rounded-2xl' },
  xl: { frame: 'rounded-xl', hairline: 'rounded-[24px]' },
  composer: { frame: 'rounded-[14px]', hairline: 'rounded-[28px]' }
} as const

export type FocusFrameRadius = keyof typeof radiusPair

type FocusFrameProps = {
  children: ReactNode
  /** 外层（定位 / 宽度） */
  className?: string
  /** 内层表面（背景、内边距、overflow） */
  frameClassName?: string
  radius?: FocusFrameRadius
  style?: CSSProperties
}

/**
 * 编辑框容器：常态 1px border；内部控件 :focus-within 时
 * 缓入 0.5px（scale 技巧）亮边，失焦缓出。新输入框一律包这层。
 */
export function FocusFrame({
  children,
  className,
  frameClassName,
  radius = 'md',
  style
}: FocusFrameProps) {
  const pair = radiusPair[radius]

  return (
    <div className={cn('group/focus relative', className)}>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0 left-0 z-10 box-border h-[200%] w-[200%] origin-top-left scale-50 border border-ring',
          'opacity-0 transition-opacity duration-500 ease-out group-focus-within/focus:opacity-100',
          pair.hairline
        )}
      />
      <div
        className={cn(
          'border border-border transition-colors duration-500 ease-out group-focus-within/focus:border-transparent',
          pair.frame,
          frameClassName
        )}
        style={style}
      >
        {children}
      </div>
    </div>
  )
}
