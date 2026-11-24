// Timeline: a vertical history (order events, recent activity).
//   items: [{ id, title, description?, time?, icon?, tone? }]  — `time` is ready-to-show text or a node.
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { ease } from '@/lib/motion'

const TONES = {
  neutral: 'bg-surface-3 text-fg-muted',
  brand: 'bg-brand-soft text-brand-fg',
  success: 'bg-success-soft text-success-fg',
  warning: 'bg-warning-soft text-warning-fg',
  danger: 'bg-danger-soft text-danger-fg',
  info: 'bg-info-soft text-info-fg',
}

export function Timeline({ items = [], className }) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <motion.li
            key={item.id ?? index}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: ease.out, delay: Math.min(index, 10) * 0.05 }}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {!last && <span aria-hidden="true" className="absolute left-[15px] top-8 bottom-0 w-px bg-line" />}
            <span
              aria-hidden="true"
              className={cn(
                'relative z-[1] grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-surface [&_svg]:size-4',
                TONES[item.tone] ?? TONES.neutral,
              )}
            >
              {item.icon ?? <span className="size-2 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium text-fg">{item.title}</p>
                {item.time && <span className="text-xs text-fg-subtle tabular-nums">{item.time}</span>}
              </div>
              {item.description && <div className="mt-0.5 text-[13px] text-fg-muted">{item.description}</div>}
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
