import { SettingsRow } from '@renderer/capabilities/preferences/settings-row'
import { Switch } from '@renderer/components/ui/switch'
import { cn } from '@renderer/lib/cn'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import type { CloseBehavior } from '@shared/capabilities/preferences'

export function SystemPane() {
  const closeBehavior = usePreferencesStore((state) => state.general.closeBehavior)
  const patchGeneral = usePreferencesStore((state) => state.patchGeneral)

  const quitOnClose = closeBehavior === 'quit'

  const setCloseBehavior = (next: CloseBehavior): void => {
    if (next === closeBehavior) return
    patchGeneral({ closeBehavior: next })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="px-1 text-xs font-medium text-muted-foreground">窗口</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <SettingsRow
            title="关闭时"
            description="点击窗口关闭按钮时的行为"
            control={
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm whitespace-nowrap',
                    !quitOnClose ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  隐藏到托盘
                </span>
                <Switch
                  aria-label="关闭时行为"
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
                  退出主程序
                </span>
              </div>
            }
          />
        </div>
      </section>
    </div>
  )
}
