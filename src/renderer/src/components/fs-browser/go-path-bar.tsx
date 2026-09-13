import { FocusFrame } from '@renderer/components/ui/focus-frame'
import { cn } from '@renderer/lib/cn'
import { useT } from '@renderer/shell/use-t'
import { CornerDownLeftIcon } from 'lucide-react'
import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent
} from 'react'

type GoPathBarProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (path: string) => void | Promise<void>
  error: string | null
  disabled?: boolean
}

export function GoPathBar({
  value,
  onChange,
  onSubmit,
  error,
  disabled = false
}: GoPathBarProps) {
  const t = useT()
  const [focused, setFocused] = useState(false)

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    if (disabled) return
    void onSubmit(value.trim())
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      handleSubmit()
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  return (
    <div className="shrink-0 border-b border-border px-3 py-2">
      <form
        className="flex items-center gap-2"
        onSubmit={handleSubmit}
      >
        <span className="shrink-0 text-sm text-muted-foreground">{t('fsBrowser.goTo')}</span>
        <FocusFrame className="min-w-0 flex-1" radius="md" frameClassName="bg-background">
          <div className="relative flex items-center">
            <input
              type="text"
              value={value}
              disabled={disabled}
              onChange={handleChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              aria-label={t('fsBrowser.goTo')}
              aria-invalid={error ? true : undefined}
              spellCheck={false}
              className={cn(
                'h-8 w-full bg-transparent px-2.5 text-sm text-foreground outline-none',
                'placeholder:text-muted-foreground disabled:opacity-60',
                focused ? 'pr-8' : 'pr-2.5'
              )}
              placeholder={t('fsBrowser.goPlaceholder')}
            />
            {focused ? (
              <button
                type="submit"
                tabIndex={-1}
                disabled={disabled || value.trim().length === 0}
                aria-label={t('fsBrowser.goSubmit')}
                className="absolute top-1/2 right-1 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground disabled:cursor-default disabled:opacity-40"
                onMouseDown={(event) => {
                  // 避免 mousedown 抢焦点导致按钮在 click 前消失
                  event.preventDefault()
                }}
              >
                <CornerDownLeftIcon className="size-3.5" />
              </button>
            ) : null}
          </div>
        </FocusFrame>
      </form>
      {error ? (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
