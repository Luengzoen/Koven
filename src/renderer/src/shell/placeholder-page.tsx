import { useT } from '@renderer/shell/use-t'
import type { MessageKey } from '@shared/i18n'

type PlaceholderPageProps = {
  title?: string
  titleKey?: MessageKey
}

export function PlaceholderPage({ title, titleKey }: PlaceholderPageProps) {
  const t = useT()
  const heading = titleKey ? t(titleKey) : (title ?? '')

  return (
    <section className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">{heading}</h1>
      <p className="text-sm text-muted-foreground">{t('placeholder.comingSoon')}</p>
    </section>
  )
}
