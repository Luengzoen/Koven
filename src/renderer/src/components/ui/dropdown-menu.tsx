import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { type ComponentProps } from 'react'
import { cn } from '@renderer/lib/cn'

function DropdownMenu(props: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root {...props} />
}

function DropdownMenuTrigger(props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger {...props} />
}

function DropdownMenuGroup(props: ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group {...props} />
}

function DropdownMenuContent({
  className,
  sideOffset = 8,
  side = 'bottom',
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        side={side}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-40 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-lg border border-border bg-card p-1 shadow-lg outline-none',
          'data-[state=open]:animate-koven-menu-in data-[state=closed]:animate-koven-menu-out',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none select-none data-highlighted:bg-accent [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
}
