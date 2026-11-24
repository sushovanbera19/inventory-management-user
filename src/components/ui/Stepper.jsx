// Stepper: where a process stands (order: pending → processing → shipped → delivered).
// Done steps get a tick that draws itself, the current step pulses, the connector fills up.
// Horizontal from 640px, vertical on phones.
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ease } from '@/lib/motion'

export function Stepper({ steps = [], current = 0, allComplete = false, cancelled = false, className }) {
  return (
    <ol className={cn('flex flex-col gap-0 sm:flex-row sm:items-start', className)}>
      {steps.map((step, index) => {
        const done = allComplete || index < current
        const active = !allComplete && index === current
        const last = index === steps.length - 1
        const failed = active && cancelled

        return (
          <li key={step.key ?? index} className="relative flex flex-1 gap-3 pb-6 last:pb-0 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center">
            {/* Connector to the next step: vertical on phones, horizontal from sm. */}
            {!last && (
              <span aria-hidden="true" className="absolute left-[17px] top-10 bottom-1 w-0.5 overflow-hidden rounded-full bg-line sm:left-[calc(50%+26px)] sm:right-[calc(-50%+26px)] sm:top-[17px] sm:bottom-auto sm:h-0.5 sm:w-auto">
                <motion.span
                  className="absolute inset-0 origin-top bg-brand-500 sm:origin-left"
                  initial={{ scaleX: 0, scaleY: 0 }}
                  animate={{ scaleY: done ? 1 : 0, scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: ease.out, delay: index * 0.12 }}
                />
              </span>
            )}

            <span className="relative grid size-9 shrink-0 place-items-center">
              {active && !cancelled && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-500/30 animate-pulse-ring" />}
              <motion.span
                initial={false}
                animate={{ scale: active ? 1.06 : 1 }}
                className={cn(
                  'relative grid size-9 place-items-center rounded-full border-2 text-sm font-semibold transition-colors duration-300 [&_svg]:size-4',
                  done && 'border-brand-500 bg-brand-500 text-white',
                  active && !failed && 'border-brand-500 bg-surface text-brand-fg shadow-glow-sm',
                  failed && 'border-danger bg-danger text-white',
                  !done && !active && 'border-line-strong bg-surface text-fg-subtle',
                )}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
                    <motion.path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, ease: ease.out, delay: index * 0.12 }}
                    />
                  </svg>
                ) : failed ? (
                  <X aria-hidden="true" />
                ) : (
                  step.icon ?? index + 1
                )}
              </motion.span>
            </span>

            <div className="min-w-0 pt-1.5 sm:px-2 sm:pt-0">
              <p className={cn('text-sm font-medium', done || active ? 'text-fg' : 'text-fg-muted', failed && 'text-danger-fg')}>
                {failed ? 'Cancelled' : step.label}
              </p>
              {step.description && <p className="mt-0.5 text-xs text-fg-subtle">{step.description}</p>}
            </div>
            <span className="sr-only">{done ? '(completed)' : active ? (failed ? '(cancelled)' : '(current step)') : '(not started)'}</span>
          </li>
        )
      })}
    </ol>
  )
}
