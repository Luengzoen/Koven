import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@renderer/components/ui/dialog'
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

  const versionText = version ? `版本 ${version}` : '正在加载版本信息'

  const copyVersion = async (): Promise<void> => {
    const text = version ? `Koven ${version}` : 'Koven'
    try {
      await navigator.clipboard.writeText(text)
      setStatus('版本信息已复制')
    } catch {
      setStatus('复制失败，请稍后重试')
    }
  }

  const checkUpdates = (): void => {
    setStatus('暂时无法检查更新')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[min(calc(100%-2rem),360px)] flex-col items-center gap-0 px-6 pt-10 pb-5 text-center">
        <DialogTitle className="sr-only">关于 Koven</DialogTitle>
        <DialogDescription className="sr-only">
          查看应用版本，并复制版本信息
        </DialogDescription>

        <img
          src={appIcon}
          alt=""
          className="size-16 rounded-2xl border border-border shadow-sm"
        />

        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">Koven</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{versionText}</p>

        <div className="mt-6 flex w-full items-center justify-center gap-2">
          <Button variant="outline" className="flex-1" onClick={checkUpdates}>
            检查更新…
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => void copyVersion()}>
            复制版本信息
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
          Copyright © {new Date().getFullYear()} Koven. All rights reserved.
        </p>
      </DialogContent>
    </Dialog>
  )
}
