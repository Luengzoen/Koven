import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { cn } from '@renderer/lib/cn'
import {
  playCompletionSound,
  subscribeCompletionSoundPlayback
} from '@renderer/shell/completion-sound'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { useT } from '@renderer/shell/use-t'
import {
  completionSoundOptions,
  type CompletionSoundId
} from '@shared/capabilities/preferences'
import { CheckIcon, ChevronDownIcon, PlayIcon } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent } from 'react'

export function CompletionSoundSelect() {
  const t = useT()
  const completionSound = usePreferencesStore((state) => state.general.completionSound)
  const patchGeneral = usePreferencesStore((state) => state.patchGeneral)
  const [playingId, setPlayingId] = useState<CompletionSoundId | null>(null)
  /** onSelect 早于 onClick，须在 pointerDown 就置位 */
  const previewingRef = useRef(false)

  useEffect(() => subscribeCompletionSoundPlayback(setPlayingId), [])

  const selected =
    completionSoundOptions.find((entry) => entry.id === completionSound) ??
    completionSoundOptions[completionSoundOptions.length - 1]!

  const selectSound = (id: CompletionSoundId): void => {
    patchGeneral({ completionSound: id })
  }

  const beginPreview = (id: CompletionSoundId): void => {
    previewingRef.current = true
    playCompletionSound(id)
  }

  const onPreviewClick = (event: MouseEvent, id: CompletionSoundId): void => {
    event.preventDefault()
    event.stopPropagation()
    beginPreview(id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="group min-w-44 justify-between gap-2 font-normal">
          <span className="truncate">{t(selected.labelKey)}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          {completionSoundOptions.map((entry) => {
            const isSelected = entry.id === completionSound
            const isPlaying = playingId === entry.id
            return (
              <DropdownMenuItem
                key={entry.id}
                className="gap-2"
                onSelect={(event) => {
                  if (previewingRef.current) {
                    previewingRef.current = false
                    event.preventDefault()
                    return
                  }
                  selectSound(entry.id)
                }}
              >
                <span className="min-w-0 flex-1 truncate">{t(entry.labelKey)}</span>
                <button
                  type="button"
                  aria-label={t('general.completionSoundPreview')}
                  className={cn(
                    'relative inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none',
                    'hover:bg-accent hover:text-foreground',
                    'focus-visible:ring-2 focus-visible:ring-ring',
                    // 盖过 MenuItem 的 [&_svg]:size-4
                    '[&_svg]:!size-2.5'
                  )}
                  onClick={(event) => onPreviewClick(event, entry.id)}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    previewingRef.current = true
                  }}
                >
                  {isPlaying ? (
                    <span className="pointer-events-none absolute inset-0 rounded-full koven-sound-ring" />
                  ) : null}
                  <PlayIcon className="relative fill-current" />
                </button>
                <CheckIcon
                  className={cn('size-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                  aria-hidden
                />
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
