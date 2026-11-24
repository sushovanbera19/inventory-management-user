// EmptyState: what a list or panel shows when there is nothing in it yet —
// a gently floating icon, a title, a short explanation and (usually) a button to add the first item.
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FadeIn } from './Motion.jsx'

const SIZES = {
  sm: {
    root: 'px-4 py-8',
    tile: 'size-12 rounded-xl [&_svg]:size-5',
    title: 'text-sm',
    description: 'text-[13px]',
    action: 'mt-4',
  },
  md: {
    root: 'px-6 py-12',
    tile: 'size-16 rounded-2xl [&_svg]:size-7',
    title: 'text-base',
    description: 'text-sm',
    action: 'mt-5',
  },
  lg: {
    root: 'px-6 py-16',
    tile: 'size-20 rounded-3xl [&_svg]:size-9',
    title: 'text-lg',
    description: 'text-sm',
    action: 'mt-6',
  },
}

export function EmptyState({ icon, title, description, action, size = 'md', className, ...rest }) {
  const styles = SIZES[size] ?? SIZES.md

  return (
    <FadeIn className={cn('flex flex-col items-center justify-center text-center', styles.root, className)} {...rest}>
      <div aria-hidden="true" className="relative mb-4">
        {/* Soft glow under the tile, so it seems to hover above the surface. */}
        <span className="absolute inset-x-1 -bottom-2 h-1/2 rounded-full bg-brand-500/25 blur-xl" />
        <span
          className={cn(
            'relative grid animate-float place-items-center bg-brand-soft text-brand-fg ring-1 ring-inset ring-brand-500/20',
            styles.tile,
          )}
        >
          {icon ?? <Inbox />}
        </span>
      </div>

      {title && <h3 className={cn('font-semibold text-fg', styles.title)}>{title}</h3>}
      {description && (
        <p className={cn('mt-1 max-w-sm text-balance text-fg-muted', styles.description)}>{description}</p>
      )}
      {action && <div className={cn('flex flex-wrap items-center justify-center gap-2', styles.action)}>{action}</div>}
    </FadeIn>
  )
}
