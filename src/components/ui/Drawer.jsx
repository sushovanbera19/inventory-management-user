// Drawer: a full-height panel that slides in from the side (forms, record details).
//   <Drawer open={isOpen} onClose={close} title="New product" size="lg" footer={…}>…</Drawer>
import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useScrollLock } from '@/hooks/useScrollLock'
import { cn } from '@/lib/cn'
import { drawerPanel, overlayFade } from '@/lib/motion'
import { IconButton } from './Button.jsx'
import { isTopOverlay, pushOverlay } from './overlayStack.js'
import { Portal } from './Portal.jsx'

const SIZES = {
  sm: 'sm:max-w-[380px]',
  md: 'sm:max-w-[480px]',
  lg: 'sm:max-w-[640px]',
  xl: 'sm:max-w-[800px]',
}

export function Drawer({ open, ...props }) {
  return (
    <Portal>
      <AnimatePresence>{open && <DrawerPanel key="drawer" {...props} />}</AnimatePresence>
    </Portal>
  )
}

function DrawerPanel({
  onClose,
  title,
  description,
  side = 'right',
  size = 'md',
  children,
  footer,
  header,
  closeOnBackdrop = true,
  className,
  bodyClassName,
}) {
  const panelRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useScrollLock(true)
  useFocusTrap(panelRef, true)

  useEffect(() => {
    const overlay = pushOverlay()
    function onKeyDown(event) {
      if (event.key === 'Escape' && isTopOverlay(overlay.id)) {
        event.stopPropagation()
        onCloseRef.current?.()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      overlay.release()
    }
  }, [])

  return (
    <div className={cn('fixed inset-0 z-50 flex', side === 'left' ? 'justify-start' : 'justify-end')}>
      <motion.div
        aria-hidden="true"
        variants={overlayFade}
        initial="hidden"
        animate="show"
        exit="exit"
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
        onClick={() => closeOnBackdrop && onClose?.()}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        variants={drawerPanel(side)}
        initial="hidden"
        animate="show"
        exit="exit"
        className={cn(
          'relative flex h-full w-full flex-col bg-surface shadow-pop outline-none',
          side === 'left' ? 'border-r border-line' : 'border-l border-line',
          SIZES[size] ?? SIZES.md,
          className,
        )}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            {header ?? (
              <>
                {title && (
                  <h2 id={titleId} className="text-lg font-semibold leading-tight text-fg">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descriptionId} className="mt-1 text-sm text-fg-muted">
                    {description}
                  </p>
                )}
              </>
            )}
          </div>
          <IconButton label="Close" size="sm" tooltip={false} onClick={() => onClose?.()} className="-mr-1.5">
            <X />
          </IconButton>
        </div>

        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6', bodyClassName)}>{children}</div>

        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  )
}
