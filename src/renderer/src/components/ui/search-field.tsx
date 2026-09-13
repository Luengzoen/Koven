import { FocusFrame, type FocusFrameRadius } from '@renderer/components/ui/focus-frame'
import { cn } from '@renderer/lib/cn'
import { useT } from '@renderer/shell/use-t'
import { SearchIcon, XIcon } from 'lucide-react'
import type { ChangeEvent, ReactNode } from 'react'

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  'aria-label'?: string
  className?: string
  frameClassName?: string
  inputClassName?: string
  radius?: FocusFrameRadius
  /** 覆盖默认放大镜；传 `null` 可去掉前导图标 */
  leading?: ReactNode | null
}

/**
 * 带清除钮的搜索框。原生 clear 在 Electron 里常无法改成手指指针，故自绘。
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
  className,
  frameClassName,
  inputClassName,
  radius = 'md',
  leading
}: SearchFieldProps) {
  const t = useT()
  const showClear = value.length > 0
  const leadingNode =
    leading === null ? null : (leading ?? (
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    ))

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  return (
    <FocusFrame
      className={className}
      radius={radius}
      frameClassName={cn('flex items-center gap-2 bg-background px-2.5 py-1.5', frameClassName)}
    >
      {leadingNode}
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          'min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground',
          '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
          inputClassName
        )}
      />
      {showClear ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground"
          aria-label={t('common.clear')}
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </FocusFrame>
  )
}
