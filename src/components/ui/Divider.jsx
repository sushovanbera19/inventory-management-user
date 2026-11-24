// Divider: a thin horizontal line, optionally with a label in the middle ("or").
import { cn } from '@/lib/cn'

export function Divider({ label, className, ...rest }) {
  if (!label) return <hr className={cn('border-0 border-t border-line', className)} {...rest} />

  return (
    <div role="separator" className={cn('flex items-center gap-3 text-xs font-medium text-fg-subtle', className)} {...rest}>
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
