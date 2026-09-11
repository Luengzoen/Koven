import { KeepAliveOutlet } from '@renderer/shell/keep-alive-outlet'
import { PageTopbar } from '@renderer/shell/page-topbar'
import { Sidebar } from '@renderer/shell/sidebar/sidebar'
import { SidebarResizeHandle } from '@renderer/shell/sidebar/sidebar-resize-handle'
import { TitleBar } from '@renderer/shell/title-bar'
import { useDocumentLang } from '@renderer/shell/use-document-lang'
import { usePersistSession } from '@renderer/shell/use-persist-session'
import { useState } from 'react'

export function AppShell() {
  const [sidebarResizing, setSidebarResizing] = useState(false)
  usePersistSession()
  useDocumentLang()

  return (
    <div className="flex h-full min-h-full flex-col">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar resizing={sidebarResizing} />
        <SidebarResizeHandle resizing={sidebarResizing} onResizingChange={setSidebarResizing} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <PageTopbar />
          <KeepAliveOutlet />
        </main>
      </div>
    </div>
  )
}
