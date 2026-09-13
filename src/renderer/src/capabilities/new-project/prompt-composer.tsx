import {
  composerModeHintKey,
  composerModeIcon,
  composerModeLabelKey,
  composerModes,
  defaultComposerMode,
  type ComposerMode
} from '@renderer/capabilities/new-project/composer-mode'
import { ComposerFooter } from '@renderer/capabilities/new-project/composer-footer'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { FocusFrame } from '@renderer/components/ui/focus-frame'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { cn } from '@renderer/lib/cn'
import { useT } from '@renderer/shell/use-t'
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  PaperclipIcon
} from 'lucide-react'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent
} from 'react'

const COMPOSER_MAX_HEIGHT = 500

export function PromptComposer() {
  const t = useT()
  const [value, setValue] = useState('')
  const [mode, setMode] = useState<ComposerMode>(defaultComposerMode)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const canSend = value.trim().length > 0
  const ModeIcon = composerModeIcon[mode]
  const modeLabel = t(composerModeLabelKey[mode])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useLayoutEffect(() => {
    const body = bodyRef.current
    const textarea = textareaRef.current
    if (!body || !textarea) return
    if (textarea.selectionStart >= value.length) {
      body.scrollTop = body.scrollHeight
    }
  }, [value])

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value)
  }

  function handleSend() {
    if (!canSend) return
    setValue('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <FocusFrame
      className="w-full"
      radius="composer"
      frameClassName="flex flex-col overflow-hidden bg-card"
      style={{ maxHeight: COMPOSER_MAX_HEIGHT }}
    >
      <div ref={bodyRef} className="min-h-0 overflow-y-auto">
        <div className="grid">
          <div
            aria-hidden
            className="invisible col-start-1 row-start-1 whitespace-pre-wrap break-words px-4 pt-4 pb-2 text-sm leading-6"
          >
            {value || ' '}
            {'\n'}
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={t('newProject.promptPlaceholder')}
            aria-label={t('newProject.promptLabel')}
            className="col-start-1 row-start-1 min-h-20 w-full resize-none overflow-hidden bg-transparent px-4 pt-4 pb-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 px-3 pt-1 pb-3">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="group h-8 gap-1.5 rounded-lg bg-muted px-2.5 text-foreground hover:bg-accent"
                  aria-label={t('newProject.modeMenu')}
                >
                  <ModeIcon className="size-3.5 text-muted-foreground" />
                  <span className="text-sm">{modeLabel}</span>
                  <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">{t('newProject.modeMenu')}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="top" align="start" className="min-w-40">
            <DropdownMenuGroup>
              {composerModes.map((id) => {
                const selected = id === mode
                const ItemIcon = composerModeIcon[id]
                return (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onSelect={() => setMode(id)}>
                        <ItemIcon className="size-4 text-muted-foreground" />
                        <span className="flex-1">{t(composerModeLabelKey[id])}</span>
                        <CheckIcon
                          className={cn('size-4', selected ? 'opacity-100' : 'opacity-0')}
                          aria-hidden
                        />
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {t(composerModeHintKey[id])}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={t('newProject.attachFile')}
            >
              <PaperclipIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('newProject.attachFile')}</TooltipContent>
        </Tooltip>

        <div className="min-w-0 flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <button
                type="button"
                disabled={!canSend}
                onClick={handleSend}
                aria-label={t('newProject.send')}
                className={cn(
                  'inline-flex size-8 cursor-pointer items-center justify-center rounded-lg outline-none transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
                  canSend
                    ? 'bg-foreground text-background hover:opacity-90'
                    : 'bg-border text-muted-foreground disabled:pointer-events-none disabled:opacity-100'
                )}
              >
                <ArrowUpIcon className="size-4" />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">{t('newProject.send')}</TooltipContent>
        </Tooltip>
      </div>

      <ComposerFooter />
    </FocusFrame>
  )
}
