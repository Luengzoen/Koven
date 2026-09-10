import appIcon from '@renderer/assets/koven.png'
import { useEffect, useState } from 'react'

export function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    void window.koven?.shell.isMaximized().then((result) => {
      if (result.ok) {
        setMaximized(result.value)
      }
    })
    const unsubscribe = window.koven?.shell.onMaximizedChange(setMaximized)
    return unsubscribe
  }, [])

  return (
    <header
      data-maximized={maximized}
      className="flex h-[30px] shrink-0 items-center bg-titlebar [-webkit-app-region:drag] select-none"
    >
      <div className="flex items-center gap-2 overflow-hidden pr-[140px] pl-3.5 whitespace-nowrap">
        <img
          src={appIcon}
          alt=""
          draggable={false}
          className="size-[18px] shrink-0 rounded object-contain select-none"
        />
        <span className="text-xs font-semibold tracking-wide text-foreground">Koven</span>
      </div>
    </header>
  )
}
