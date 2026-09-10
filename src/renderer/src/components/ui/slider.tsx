import { cn } from '@renderer/lib/cn'
import { type KeyboardEvent, type PointerEvent, useId, useRef } from 'react'

export type SliderTickLabel = {
  index: number
  label: string
}

type SliderProps = {
  value: number
  min?: number
  max?: number
  step?: number
  onValueChange: (value: number) => void
  /** 刻度下方稀疏标签（按档位 index） */
  tickLabels?: readonly SliderTickLabel[]
  'aria-label'?: string
  className?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function snap(value: number, min: number, max: number, step: number): number {
  const snapped = Math.round((value - min) / step) * step + min
  return clamp(snapped, min, max)
}

/** 离散档位滑条：刻度 + 胶囊拇指 + 下方标签；语义色适配明暗主题 */
export function Slider({
  value,
  min = 0,
  max = 4,
  step = 1,
  onValueChange,
  tickLabels = [],
  'aria-label': ariaLabel,
  className
}: SliderProps) {
  const id = useId()
  const trackRef = useRef<HTMLDivElement>(null)
  const steps = Math.round((max - min) / step)
  const ratio = steps === 0 ? 0 : (value - min) / (max - min)

  const setFromClientX = (clientX: number): void => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) return
    const t = clamp((clientX - rect.left) / rect.width, 0, 1)
    onValueChange(snap(min + t * (max - min), min, max, step))
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setFromClientX(event.clientX)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    setFromClientX(event.clientX)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      onValueChange(snap(value - step, min, max, step))
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      onValueChange(snap(value + step, min, max, step))
    } else if (event.key === 'Home') {
      event.preventDefault()
      onValueChange(min)
    } else if (event.key === 'End') {
      event.preventDefault()
      onValueChange(max)
    }
  }

  const labelAt = (index: number): string | undefined =>
    tickLabels.find((entry) => entry.index === index)?.label

  return (
    <div className={cn('flex w-52 flex-col gap-1.5', className)}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-labelledby={tickLabels.length > 0 ? `${id}-labels` : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className={cn(
          'relative flex h-6 cursor-pointer items-center outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card'
        )}
      >
        {/* 未激活轨 */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        {/* 已激活轨 */}
        <div
          className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-foreground"
          style={{ width: `${ratio * 100}%` }}
        />

        {Array.from({ length: steps + 1 }, (_, i) => {
          const left = steps === 0 ? 0 : (i / steps) * 100
          const active = i <= (value - min) / step
          return (
            <span
              key={i}
              aria-hidden
              className={cn(
                'absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2',
                active ? 'bg-foreground' : 'bg-muted-foreground/50'
              )}
              style={{ left: `${left}%` }}
            />
          )
        })}

        <span
          aria-hidden
          className={cn(
            'absolute top-1/2 h-4 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
            'border border-border bg-card shadow-sm',
            'dark:border-muted-foreground/40 dark:bg-muted'
          )}
          style={{ left: `${ratio * 100}%` }}
        />
      </div>

      {tickLabels.length > 0 ? (
        <div id={`${id}-labels`} className="relative h-4" aria-hidden>
          {Array.from({ length: steps + 1 }, (_, i) => {
            const label = labelAt(i)
            if (!label) return null
            const left = steps === 0 ? 0 : (i / steps) * 100
            const align =
              i === 0 ? 'translate-x-0' : i === steps ? '-translate-x-full' : '-translate-x-1/2'
            return (
              <span
                key={i}
                className={cn(
                  'absolute top-0 text-xs leading-none text-muted-foreground',
                  align
                )}
                style={{ left: `${left}%` }}
              >
                {label}
              </span>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
