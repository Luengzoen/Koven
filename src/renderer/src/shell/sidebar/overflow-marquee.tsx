import { HighlightText } from '@renderer/shell/sidebar/highlight-text'
import { cn } from '@renderer/lib/cn'
import { useRef, useState, type CSSProperties } from 'react'

type OverflowMarqueeProps = {
  text: string
  highlightQuery?: string
  className?: string
}

/** 超长文本：悬停时头尾相接无限慢滚；未溢出则静止 */
export function OverflowMarquee({
  text,
  highlightQuery = '',
  className
}: OverflowMarqueeProps) {
  const outerRef = useRef<HTMLSpanElement>(null)
  const segmentRef = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(false)
  const [durationSec, setDurationSec] = useState(10)

  const measureOverflow = (): boolean => {
    const outer = outerRef.current
    const segment = segmentRef.current
    if (!outer || !segment) return false
    const overflow = segment.scrollWidth - outer.clientWidth
    if (overflow <= 1) return false
    // 约 18px/s，整圈按「一段+间距」宽度估算
    const loopWidth = segment.scrollWidth + 32
    setDurationSec(Math.max(10, loopWidth / 18))
    return true
  }

  return (
    <span
      ref={outerRef}
      className={cn('block min-w-0 overflow-hidden', className)}
      onMouseEnter={() => setActive(measureOverflow())}
      onMouseLeave={() => setActive(false)}
    >
      <span
        className={cn(
          'inline-flex max-w-none whitespace-nowrap will-change-transform',
          active && 'koven-marquee-loop'
        )}
        style={
          {
            '--koven-marquee-duration': `${durationSec}s`
          } as CSSProperties
        }
      >
        <span ref={segmentRef} className="inline-block shrink-0 pr-8">
          <HighlightText text={text} query={highlightQuery} />
        </span>
        {active ? (
          <span aria-hidden className="inline-block shrink-0 pr-8">
            <HighlightText text={text} query={highlightQuery} />
          </span>
        ) : null}
      </span>
    </span>
  )
}
