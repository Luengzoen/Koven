import { SettingsRow } from '@renderer/capabilities/preferences/settings-row'
import { Switch } from '@renderer/components/ui/switch'
import { cn } from '@renderer/lib/cn'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { useT } from '@renderer/shell/use-t'
import type { CloseBehavior } from '@shared/capabilities/preferences'

export function SystemPane() {
  const closeBehavior = usePreferencesStore((state) => state.general.closeBehavior)
  const patchGeneral = usePreferencesStore((state) => state.patchGeneral)
  const t = useT()

  const quitOnClose = closeBehavior === 'quit'

  const setCloseBehavior = (next: CloseBehavior): void => {
    if (next === closeBehavior) return
    patchGeneral({ closeBehavior: next })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="px-1 text-xs font-medium text-muted-foreground">{t('system.window')}</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <SettingsRow
            title={t('system.onClose')}
            description={t('system.onCloseDescription')}
            control={
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm whitespace-nowrap',
                    !quitOnClose ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {t('system.hideToTray')}
                </span>
                <Switch
                  aria-label={t('system.closeBehavior')}
                  checked={quitOnClose}
                  onCheckedChange={(checked) => {
                    setCloseBehavior(checked ? 'quit' : 'tray')
                  }}
                />
                <span
                  className={cn(
                    'text-sm whitespace-nowrap',
                    quitOnClose ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {t('system.quit')}
                </span>
              </div>
            }
          />
        </div>
      </section>
    </div>
  )
}
