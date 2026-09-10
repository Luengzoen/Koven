import type { AppInfo } from '@shared/app-api'
import { useEffect, useState } from 'react'

export function AppInfoGrid() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    void window.koven?.appInfo.get().then((result) => {
      if (result.ok) {
        setAppInfo(result.value)
      }
    })
  }, [])

  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <InfoItem label="Electron" value={appInfo?.electronVersion} />
      <InfoItem label="Chrome" value={appInfo?.chromeVersion} />
      <InfoItem label="Node" value={appInfo?.nodeVersion} />
      <InfoItem label="数据目录" value={appInfo?.dataRoot} />
    </dl>
  )
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium" title={value}>
        {value ?? '读取中…'}
      </dd>
    </div>
  )
}
