import { useShellLayoutStore } from '@renderer/shell/shell-layout-store'
import { useT } from '@renderer/shell/use-t'
import { cn } from '@renderer/lib/cn'
import { useEffect, useRef } from 'react'

type SidebarResizeHandleProps = {
  resizing: boolean
  onResizingChange: (resizing: boolean) => void
}

export function SidebarResizeHandle({ resizing, onResizingChange }: SidebarResizeHandleProps) {
  const sidebarOpen = useShellLayoutStore((state) => state.sidebarOpen)
  const setSidebarWidth = useShellLayoutStore((state) => state.setSidebarWidth)
  const dragging = useRef(false)
  const t = useT()

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (!dragging.current) return
      setSidebarWidth(event.clientX)
    }

    function onPointerUp() {
      if (!dragging.current) return
      dragging.current = false
      onResizingChange(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [onResizingChange, setSidebarWidth])

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t('nav.resizeSidebar')}
      aria-hidden={!sidebarOpen}
      className={cn(
        'group relative z-10 w-0 shrink-0 transition-opacity duration-200',
        sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <button
        type="button"
        tabIndex={sidebarOpen ? 0 : -1}
        disabled={!sidebarOpen}
        className="absolute top-0 left-0 h-full w-1.5 -translate-x-1/2 cursor-col-resize touch-none border-0 bg-transparent p-0 outline-none disabled:cursor-default"
        onPointerDown={(event) => {
          if (!sidebarOpen) return
          event.preventDefault()
          dragging.current = true
          onResizingChange(true)
          document.body.style.cursor = 'col-resize'
          document.body.style.userSelect = 'none'
        }}
      />
      <div
        className={cn(
          'pointer-events-none absolute top-0 left-0 h-full w-px -translate-x-1/2 bg-transparent transition-colors',
          resizing ? 'bg-muted-foreground' : 'group-hover:bg-border'
        )}
      />
    </div>
  )
}
