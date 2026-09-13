import * as PopoverPrimitive from '@radix-ui/react-popover'
import { type ComponentProps } from 'react'
import { cn } from '@renderer/lib/cn'

function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />
}

function PopoverTrigger(props: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger {...props} />
}

function PopoverAnchor(props: ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor {...props} />
}

function PopoverContent({
  className,
  sideOffset = 8,
  align = 'start',
  side = 'top',
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        side={side}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 origin-[var(--radix-popover-content-transform-origin)] overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-popover)] outline-none',
          'data-[state=open]:animate-koven-popover-in data-[state=closed]:animate-koven-popover-out',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
