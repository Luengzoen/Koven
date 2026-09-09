import { AboutMenu } from '@renderer/capabilities/app-info/about-menu'
import { AppInfoGrid } from '@renderer/capabilities/app-info/app-info-grid'
import { CounterPanel } from '@renderer/capabilities/shelf/counter-panel'
import { Separator } from '@renderer/components/ui/separator'

export function ShelfPage() {
  return (
    <section className="flex w-full max-w-xl flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Koven</h1>
          <p className="text-sm text-zinc-400">
            Electron + React + Radix + Tailwind + Zustand，仅 Windows，数据写在项目内。
          </p>
        </div>
        <AboutMenu />
      </header>

      <Separator />
      <AppInfoGrid />
      <CounterPanel />
    </section>
  )
}
