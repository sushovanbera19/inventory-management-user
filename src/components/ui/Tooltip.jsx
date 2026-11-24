// Tooltip: a short dark label that appears on mouse hover or keyboard focus (never on touch).
//   <Tooltip content="Edit product"><button>…</button></Tooltip>
import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useFloating } from '@/hooks/useFloating'
import { cn } from '@/lib/cn'
import { Portal } from './Portal.jsx'

export function Tooltip({ content, side = 'top', delay = 350, disabled, className, children }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const floatingRef = useRef(null)
  const timerRef = useRef(null)
  const id = useId()

  useFloating({ open, triggerRef, floatingRef, side, align: 'center', offset: 6 })
  useEffect(() => () => clearTimeout(timerRef.current), [])

  if (!content || disabled) return children

  function show(wait) {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setOpen(true), wait)
  }
  function hide() {
    clearTimeout(timerRef.current)
    setOpen(false)
  }

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      aria-describedby={open ? id : undefined}
      onPointerEnter={(event) => event.pointerType === 'mouse' && show(delay)}
      onPointerLeave={hide}
      onPointerDown={hide}
      // Only keyboard focus shows it: a mouse click also focuses, and the hover already covered that.
      onFocus={(event) => event.target.matches?.(':focus-visible') && show(0)}
      onBlur={hide}
      onKeyDown={(event) => event.key === 'Escape' && hide()}
    >
      {children}
      <Portal>
        <AnimatePresence>
          {open && (
            <motion.span
              ref={floatingRef}
              id={id}
              role="tooltip"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.08 } }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'pointer-events-none fixed left-0 top-0 z-[80] max-w-64 rounded-lg bg-fg px-2.5 py-1.5 text-xs font-medium leading-snug text-bg shadow-pop',
                className,
              )}
            >
              {content}
            </motion.span>
          )}
        </AnimatePresence>
      </Portal>
    </span>
  )
}
