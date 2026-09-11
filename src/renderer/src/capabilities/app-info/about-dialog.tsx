import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { useT } from '@renderer/shell/use-t'
import appIcon from '@renderer/assets/koven.png'
import { CornerDownLeftIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

type AboutDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const [version, setVersion] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const t = useT()

  useEffect(() => {
    if (!open) {
      setStatus(null)
      return
    }
    void window.koven?.appInfo.get().then((result) => {
      if (result.ok) {
        setVersion(result.value.version)
      }
    })
  }, [open])

  const versionText = version
    ? t('about.version', { v: version })
    : t('about.loadingVersion')

  const copyVersion = async (): Promise<void> => {
    const text = version ? `Koven ${version}` : 'Koven'
    try {
      await navigator.clipboard.writeText(text)
      setStatus(t('about.versionCopied'))
    } catch {
      setStatus(t('about.copyFailed'))
    }
  }

  const checkUpdates = (): void => {
    setStatus(t('about.updatesUnavailable'))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[min(calc(100%-2rem),360px)] flex-col items-center gap-0 px-6 pt-10 pb-5 text-center">
        <DialogTitle className="sr-only">{t('about.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('about.description')}</DialogDescription>

        <img
          src={appIcon}
          alt=""
          className="size-16 rounded-2xl border border-border shadow-sm"
        />

        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">Koven</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{versionText}</p>

        <div className="mt-6 flex w-full items-center justify-center gap-2">
          <Button variant="outline" className="flex-1" onClick={checkUpdates}>
            {t('about.checkUpdates')}
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => void copyVersion()}>
            {t('about.copyVersion')}
            <CornerDownLeftIcon />
          </Button>
        </div>

        {status ? (
          <p className="mt-3 text-xs text-muted-foreground" role="status">
            {status}
          </p>
        ) : (
          <span className="mt-3 h-4" aria-hidden />
        )}

        <p className="mt-2 text-xs text-muted-foreground/80">
          {t('about.copyright', { year: new Date().getFullYear() })}
        </p>
      </DialogContent>
    </Dialog>
  )
}
