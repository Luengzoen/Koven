import { cn } from '@renderer/lib/cn'

type SwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  'aria-label'?: string
  className?: string
  disabled?: boolean
}

/** 二态开关：未选中=左，选中=右；语义色适配明暗 */
export function Switch({
  checked,
  onCheckedChange,
  'aria-label': ariaLabel,
  className,
  disabled = false
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'bg-muted-foreground/40',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-card shadow-sm ring-1 ring-border transition-transform',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}
