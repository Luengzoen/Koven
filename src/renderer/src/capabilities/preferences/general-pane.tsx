import { SettingsRow } from '@renderer/capabilities/preferences/settings-row'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Slider } from '@renderer/components/ui/slider'
import { applyTypography } from '@renderer/shell/apply-typography'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import {
  fontFamilyOptions,
  fontSizeOptions,
  type FontFamilyId,
  type FontSizeId
} from '@shared/capabilities/preferences'
import { ChevronDownIcon } from 'lucide-react'

const fontSizeIndex: Record<FontSizeId, number> = {
  xs: 0,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4
}

const fontSizeByIndex = fontSizeOptions.map((entry) => entry.id)

function fontLabel(id: FontFamilyId): string {
  return fontFamilyOptions.find((entry) => entry.id === id)?.label ?? id
}

function fontCss(id: FontFamilyId): string {
  return fontFamilyOptions.find((entry) => entry.id === id)?.cssFamily ?? fontFamilyOptions[0].cssFamily
}

const fontSizeTickLabels = [
  { index: 0, label: '小' },
  { index: 2, label: '默认' },
  { index: 4, label: '大' }
] as const

export function GeneralPane() {
  const general = usePreferencesStore((state) => state.general)
  const patchGeneral = usePreferencesStore((state) => state.patchGeneral)

  const selectFontFamily = (fontFamily: FontFamilyId): void => {
    const next = { ...general, fontFamily }
    patchGeneral({ fontFamily })
    applyTypography(next)
  }

  const selectFontSize = (index: number): void => {
    const fontSize = fontSizeByIndex[index]
    if (!fontSize) return
    const next = { ...general, fontSize }
    patchGeneral({ fontSize })
    applyTypography(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="px-1 text-xs font-medium text-muted-foreground">文字</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <SettingsRow
            title="字体"
            description="选择界面使用的中文字体"
            control={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-32 justify-between font-normal">
                    <span style={{ fontFamily: fontCss(general.fontFamily) }}>
                      {fontLabel(general.fontFamily)}
                    </span>
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-36">
                  <DropdownMenuGroup>
                    {fontFamilyOptions.map((entry) => (
                      <DropdownMenuItem
                        key={entry.id}
                        onSelect={() => selectFontFamily(entry.id)}
                        style={{ fontFamily: entry.cssFamily }}
                      >
                        {entry.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
          <SettingsRow
            className="border-t border-border"
            title="字体大小"
            description="调整界面文字整体大小"
            control={
              <Slider
                aria-label="字体大小"
                value={fontSizeIndex[general.fontSize]}
                min={0}
                max={fontSizeOptions.length - 1}
                step={1}
                tickLabels={fontSizeTickLabels}
                onValueChange={selectFontSize}
              />
            }
          />
        </div>
      </section>
    </div>
  )
}
