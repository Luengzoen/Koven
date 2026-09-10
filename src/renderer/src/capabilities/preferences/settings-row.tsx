import { type ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

type SettingsRowProps = {
  title: string
  description: string
  control: ReactNode
  className?: string
}

export function SettingsRow({ title, description, control, className }: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-6 px-4 py-3.5',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}
