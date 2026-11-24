// Kbd: a keyboard key, e.g. <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>.
import { cn } from '@/lib/cn'

export function Kbd({ className, children, ...rest }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong bg-surface px-1.5 font-sans text-[11px] font-medium text-fg-muted shadow-[0_1px_0_var(--line-strong)]',
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  )
}
