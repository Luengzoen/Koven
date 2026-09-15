import { AppShell } from '@renderer/shell/app-shell'
import { hydrateProjects, hydrateSession } from '@renderer/shell/session-persistence'
import { useThemeSync } from '@renderer/shell/use-theme-sync'
import { useEffect, useState } from 'react'

function notifyUiReadyOnce(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.koven?.shell.notifyUiReady?.()
    })
  })
}

function AppReady() {
  useThemeSync()

  useEffect(() => {
    void hydrateProjects()
  }, [])

  useEffect(() => {
    notifyUiReadyOnce()
  }, [])

  return <AppShell />
}

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
    return <div className="h-full bg-background" />
  }

  return <AppReady />
}
