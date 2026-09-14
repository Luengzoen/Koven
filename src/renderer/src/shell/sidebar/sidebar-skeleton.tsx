import { cn } from '@renderer/lib/cn'

export function SidebarSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 px-1 py-1" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn('h-7 rounded-md koven-skeleton', index % 2 === 1 && 'ml-4')}
        />
      ))}
    </div>
  )
}
