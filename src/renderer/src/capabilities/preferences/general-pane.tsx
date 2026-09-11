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
import { useT } from '@renderer/shell/use-t'
import {
  fontFamilyOptions,
  fontSizeOptions,
  type FontFamilyId,
  type FontSizeId,
  type LocaleId
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

const localeOptions = [
  { id: 'zh-CN' as const, labelKey: 'general.localeZhCN' as const },
  { id: 'en' as const, labelKey: 'general.localeEn' as const }
]

export function GeneralPane() {
  const general = usePreferencesStore((state) => state.general)
  const locale = usePreferencesStore((state) => state.locale)
  const patchGeneral = usePreferencesStore((state) => state.patchGeneral)
  const setLocale = usePreferencesStore((state) => state.setLocale)
  const t = useT()

  const fontSizeTickLabels = [
    { index: 0, label: t('general.fontSizeSmall') },
    { index: 2, label: t('general.fontSizeDefault') },
    { index: 4, label: t('general.fontSizeLarge') }
  ]

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

  const selectLocale = (next: LocaleId): void => {
    if (next === locale) return
    setLocale(next)
    void window.koven?.preferences.set({ locale: next })
  }

  const localeLabel =
    localeOptions.find((entry) => entry.id === locale)?.labelKey ?? 'general.localeZhCN'

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="px-1 text-xs font-medium text-muted-foreground">{t('general.text')}</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <SettingsRow
            title={t('general.font')}
            description={t('general.fontDescription')}
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
            title={t('general.fontSize')}
            description={t('general.fontSizeDescription')}
            control={
              <Slider
                aria-label={t('general.fontSize')}
                value={fontSizeIndex[general.fontSize]}
                min={0}
                max={fontSizeOptions.length - 1}
                step={1}
                tickLabels={fontSizeTickLabels}
                onValueChange={selectFontSize}
              />
            }
          />
          <SettingsRow
            className="border-t border-border"
            title={t('general.language')}
            description={t('general.languageDescription')}
            control={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-32 justify-between font-normal">
                    <span>{t(localeLabel)}</span>
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-36">
                  <DropdownMenuGroup>
                    {localeOptions.map((entry) => (
                      <DropdownMenuItem
                        key={entry.id}
                        onSelect={() => selectLocale(entry.id)}
                      >
                        {t(entry.labelKey)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        </div>
      </section>
    </div>
  )
}
