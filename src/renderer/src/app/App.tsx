import { AppShell } from '@renderer/shell/app-shell'
import { hydrateSession } from '@renderer/shell/session-persistence'
import { useEffect, useState } from 'react'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void hydrateSession().finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <div className="h-full bg-zinc-950" />
  }

  return <AppShell />
}
