// Toaster: draws the toast stack (bottom-right on desktop, top on phones).
// Each toast closes itself after its duration; hovering pauses the countdown; it can be swiped away.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { toastMotion } from '@/lib/motion'
import { Portal } from './Portal.jsx'

const TONES = {
  success: { icon: CircleCheck, tile: 'bg-success-soft text-success-fg', bar: 'bg-success' },
  danger: { icon: CircleAlert, tile: 'bg-danger-soft text-danger-fg', bar: 'bg-danger' },
  warning: { icon: TriangleAlert, tile: 'bg-warning-soft text-warning-fg', bar: 'bg-warning' },
  info: { icon: Info, tile: 'bg-info-soft text-info-fg', bar: 'bg-info' },
}

export function Toaster({ toasts, onDismiss }) {
  return (
    <Portal>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col-reverse sm:items-end sm:p-5"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </Portal>
  )
}

function ToastItem({ toast, onDismiss }) {
  const tone = TONES[toast.tone] ?? TONES.info
  const Icon = tone.icon
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(toast.duration)
  const startedRef = useRef(0)
  const timerRef = useRef(null)

  // The countdown: runs while not paused, remembers how much time was left when paused.
  useEffect(() => {
    if (paused || !toast.duration) return undefined
    startedRef.current = Date.now()
    timerRef.current = setTimeout(() => onDismiss(toast.id), remainingRef.current)
    return () => {
      clearTimeout(timerRef.current)
      remainingRef.current -= Date.now() - startedRef.current
    }
  }, [paused, toast.id, toast.duration, onDismiss])

  return (
    <motion.div
      layout
      variants={toastMotion}
      initial="hidden"
      animate="show"
      exit="exit"
      role={toast.tone === 'danger' ? 'alert' : 'status'}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.1, right: 0.9 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 90 || info.velocity.x > 600) onDismiss(toast.id)
      }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className="pointer-events-auto relative w-full max-w-[min(24rem,calc(100vw-1.5rem))] touch-pan-y overflow-hidden rounded-2xl border border-line bg-surface shadow-pop sm:w-96"
    >
      <div className="flex items-start gap-3 p-3.5 pr-11">
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', tone.tile)}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-sm font-semibold leading-snug text-fg">{toast.title}</p>
          {toast.description && <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">{toast.description}</p>}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action.onClick?.()
                onDismiss(toast.id)
              }}
              className="mt-2 text-[13px] font-semibold text-brand-fg underline-offset-2 hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <X className="size-4" />
      </button>
      {toast.duration > 0 && (
        <span
          aria-hidden="true"
          className={cn('absolute inset-x-0 bottom-0 h-0.5 origin-left opacity-60', tone.bar)}
          style={{ animation: `toast-countdown ${toast.duration}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      )}
    </motion.div>
  )
}
