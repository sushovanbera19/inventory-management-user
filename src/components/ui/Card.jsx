// Card: the standard surface (soft border + shadow) that page content sits on.
//   <Card>…</Card>                                           simple content with padding
//   <Card padding="none"><CardHeader/><CardBody/><CardFooter/></Card>   panel with sections
// Inside a <Stagger> a Card fades up in turn; anywhere else it is a plain, static element.
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { fadeUp, hoverLift } from '@/lib/motion'

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ hover = false, padding = 'md', className, children, ...motionProps }) {
  const isFlush = padding === 'none'

  return (
    <motion.div
      variants={fadeUp}
      // Lets a DataTable / Pagination placed inside know it already sits on a surface (see those files).
      data-card={isFlush ? 'flush' : 'padded'}
      {...(hover ? hoverLift : null)}
      className={cn(
        'min-w-0 rounded-2xl border border-line bg-surface shadow-card',
        PADDING[padding] ?? PADDING.md,
        // Without padding the sections touch the edges, so clip them to the rounded corners.
        isFlush && 'overflow-clip',
        hover && 'transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-raised',
        className,
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

/** Top section of a card: optional icon tile, title + description on the left, `action` on the right. */
export function CardHeader({ title, description, icon, action, className, children, ...rest }) {
  const hasHeading = Boolean(title || description || icon)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line px-5 py-4',
        className,
      )}
      {...rest}
    >
      {hasHeading && (
        // basis-48: on a narrow card the action drops below the title instead of squeezing it.
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
          {icon && (
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-fg [&_svg]:size-[18px]"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {title && <h3 className="text-base font-semibold text-fg">{title}</h3>}
            {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
          </div>
        </div>
      )}
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      {children != null && children !== false && <div className="w-full min-w-0">{children}</div>}
    </div>
  )
}

export function CardBody({ className, children, ...rest }) {
  return (
    <div className={cn('p-5', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...rest }) {
  return (
    <div className={cn('border-t border-line bg-surface-2/50 px-5 py-3.5', className)} {...rest}>
      {children}
    </div>
  )
}
