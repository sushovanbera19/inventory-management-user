// Badge: a small coloured label for a status or category.
//   <Badge tone="success" dot>Delivered</Badge>   <Badge tone="warning" icon={<Clock />}>Pending</Badge>
import { cn } from '@/lib/cn'

const SOFT = {
  neutral: 'bg-surface-3 text-fg-muted',
  brand: 'bg-brand-soft text-brand-fg',
  success: 'bg-success-soft text-success-fg',
  warning: 'bg-warning-soft text-warning-fg',
  danger: 'bg-danger-soft text-danger-fg',
  info: 'bg-info-soft text-info-fg',
}

const SOLID = {
  neutral: 'bg-fg-muted text-surface',
  brand: 'bg-brand-600 text-white',
  success: 'bg-success text-surface',
  warning: 'bg-warning text-surface',
  danger: 'bg-danger text-surface',
  info: 'bg-info text-surface',
}

const OUTLINE = {
  neutral: 'border border-line-strong text-fg-muted',
  brand: 'border border-brand-500/40 text-brand-fg',
  success: 'border border-success/40 text-success-fg',
  warning: 'border border-warning/40 text-warning-fg',
  danger: 'border border-danger/40 text-danger-fg',
  info: 'border border-info/40 text-info-fg',
}

const DOT = {
  neutral: 'bg-fg-subtle',
  brand: 'bg-brand-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}

const SIZES = {
  sm: 'h-5 gap-1 px-2 text-[11px] [&_svg]:size-3',
  md: 'h-6 gap-1.5 px-2.5 text-xs [&_svg]:size-3.5',
}

export function Badge({ tone = 'neutral', variant = 'soft', size = 'md', dot, pulse, icon, className, children, ...rest }) {
  const palette = variant === 'solid' ? SOLID : variant === 'outline' ? OUTLINE : SOFT

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-medium leading-none [&_svg]:shrink-0',
        palette[tone] ?? palette.neutral,
        SIZES[size] ?? SIZES.md,
        className,
      )}
      {...rest}
    >
      {dot && (
        <span className="relative flex size-1.5 shrink-0" aria-hidden="true">
          {pulse && <span className={cn('absolute inset-0 rounded-full animate-pulse-ring', variant === 'solid' ? 'bg-white' : DOT[tone])} />}
          <span className={cn('relative size-1.5 rounded-full', variant === 'solid' ? 'bg-white' : DOT[tone])} />
        </span>
      )}
      {icon}
      {children}
    </span>
  )
}
