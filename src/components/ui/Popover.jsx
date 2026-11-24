// Popover: a floating panel of free-form content (filters, notifications) that opens from a button.
//   <Popover trigger={<Button>Filters</Button>}>{({ close }) => <FilterForm onDone={close} />}</Popover>
// Pass `open` + `onOpenChange` to control it from outside.
import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useFloating } from '@/hooks/useFloating'
import { cn } from '@/lib/cn'
import { popIn } from '@/lib/motion'
import { isTopOverlay, pushOverlay } from './overlayStack.js'
import { Portal } from './Portal.jsx'

export function Popover({ trigger, align = 'start', side = 'bottom', width, open: controlledOpen, onOpenChange, className, children }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const panelId = useId()
  const onOpenChangeRef = useRef(onOpenChange)

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })

  function setOpen(next) {
    if (controlledOpen === undefined) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }
  const close = () => setOpen(false)

  useFloating({ open, triggerRef, floatingRef: panelRef, side, align })
  useClickOutside([triggerRef, panelRef], close, open)

  useEffect(() => {
    if (!open) return undefined
    const overlay = pushOverlay()
    function onKeyDown(event) {
      if (event.key === 'Escape' && isTopOverlay(overlay.id)) {
        event.stopPropagation()
        setUncontrolledOpen(false)
        onOpenChangeRef.current?.(false)
        triggerRef.current?.querySelector('button, a, [tabindex]')?.focus({ preventScroll: true })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      overlay.release()
    }
  }, [open])

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger, {
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-controls': open ? panelId : undefined,
        onClick: (event) => {
          trigger.props.onClick?.(event)
          event.stopPropagation()
          setOpen(!open)
        },
      })
    : trigger

  return (
    <>
      <span ref={triggerRef} className="inline-flex">
        {triggerElement}
      </span>
      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              id={panelId}
              role="dialog"
              variants={popIn}
              initial="hidden"
              animate="show"
              exit="exit"
              style={width ? { width } : undefined}
              className={cn(
                'fixed left-0 top-0 z-[60] max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl border border-line bg-surface shadow-pop',
                className,
              )}
            >
              {typeof children === 'function' ? children({ close }) : children}
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )
}
