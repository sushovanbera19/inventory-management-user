// Modal: a dialog above the page. Centred on tablets and desktops, a bottom sheet on phones.
//   <Modal open={isOpen} onClose={close} title="Edit customer" footer={<Button type="submit" form="customer-form">Save</Button>}>
//     <form id="customer-form">…</form>
//   </Modal>
import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useScrollLock } from '@/hooks/useScrollLock'
import { cn } from '@/lib/cn'
import { modalPanel, overlayFade, sheetPanel } from '@/lib/motion'
import { IconButton } from './Button.jsx'
import { isTopOverlay, pushOverlay } from './overlayStack.js'
import { Portal } from './Portal.jsx'

const SIZES = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[520px]',
  lg: 'sm:max-w-[720px]',
  xl: 'sm:max-w-[960px]',
}

export function Modal({ open, ...props }) {
  return (
    <Portal>
      <AnimatePresence>{open && <ModalPanel key="modal" {...props} />}</AnimatePresence>
    </Portal>
  )
}

/** Mounted only while open, so the scroll lock, focus trap and Escape handling live exactly as long as the dialog. */
function ModalPanel({
  onClose,
  title,
  description,
  icon,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  hideCloseButton = false,
  className,
  bodyClassName,
}) {
  const panelRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const isSheet = !useMediaQuery('(min-width: 640px)')
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useScrollLock(true)
  useFocusTrap(panelRef, true)

  useEffect(() => {
    const overlay = pushOverlay()
    function onKeyDown(event) {
      if (event.key === 'Escape' && closeOnEscape && isTopOverlay(overlay.id)) {
        event.stopPropagation()
        onCloseRef.current?.()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      overlay.release()
    }
  }, [closeOnEscape])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
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
        variants={isSheet ? sheetPanel : modalPanel}
        initial="hidden"
        animate="show"
        exit="exit"
        className={cn(
          'relative flex w-full flex-col overflow-hidden border border-line bg-surface shadow-pop outline-none',
          'max-h-[92dvh] rounded-t-3xl pb-[env(safe-area-inset-bottom)] sm:max-h-[88dvh] sm:rounded-2xl sm:pb-0',
          SIZES[size] ?? SIZES.md,
          className,
        )}
      >
        {isSheet && <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong" />}

        {(title || !hideCloseButton) && (
          <div className="flex shrink-0 items-start gap-3 px-5 pt-4 pb-3 sm:px-6 sm:pt-5">
            {icon && (
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-fg [&_svg]:size-5">
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
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
            </div>
            {!hideCloseButton && (
              <IconButton label="Close" size="sm" tooltip={false} onClick={() => onClose?.()} className="-mr-1.5 -mt-0.5">
                <X />
              </IconButton>
            )}
          </div>
        )}

        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1 sm:px-6', bodyClassName)}>{children}</div>

        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-3.5 sm:px-6 [&>*]:max-sm:flex-1">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  )
}
