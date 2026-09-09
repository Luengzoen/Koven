import { Button } from '@renderer/components/ui/button'
import { useCounterStore } from '@renderer/capabilities/shelf/counter-store'
import { RotateCcwIcon } from 'lucide-react'

export function CounterPanel() {
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)
  const reset = useCounterStore((state) => state.reset)

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-zinc-400">Zustand 计数</span>
        <strong className="text-3xl font-semibold">{count}</strong>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={reset} aria-label="重置">
          <RotateCcwIcon />
        </Button>
        <Button onClick={increment}>加一</Button>
      </div>
    </div>
  )
}
