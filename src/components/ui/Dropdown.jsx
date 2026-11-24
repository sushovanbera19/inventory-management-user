// Dropdown: a menu of actions that opens from a button.
//   <Dropdown trigger={<IconButton label="More"><Ellipsis /></IconButton>}>
//     <DropdownItem icon={<Pencil />} onSelect={edit}>Edit</DropdownItem>
//     <DropdownSeparator />
//     <DropdownItem icon={<Trash2 />} tone="danger" onSelect={remove}>Delete</DropdownItem>
//   </Dropdown>
import { cloneElement, createContext, isValidElement, useContext, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useFloating } from '@/hooks/useFloating'
import { cn } from '@/lib/cn'
import { popIn } from '@/lib/motion'
import { isTopOverlay, pushOverlay } from './overlayStack.js'
import { Portal } from './Portal.jsx'

// Lets the items close the menu they belong to.
const MenuContext = createContext({ close: () => {} })

function menuItems(menu) {
  return [...(menu?.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])') ?? [])]
}

export function Dropdown({ trigger, align = 'end', width = 224, className, children, onOpenChange }) {
  const [open, setOpenState] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()
  const onOpenChangeRef = useRef(onOpenChange)

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })

  function setOpen(next) {
    setOpenState(next)
    onOpenChange?.(next)
  }

  function close({ restoreFocus = true } = {}) {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.querySelector('button, a, [tabindex]')?.focus({ preventScroll: true })
  }

  useFloating({ open, triggerRef, floatingRef: menuRef, side: 'bottom', align })
  useClickOutside([triggerRef, menuRef], () => close({ restoreFocus: false }), open)

  // Focus the first item when the menu opens; Escape closes it (only if it is the top overlay).
  useEffect(() => {
    if (!open) return undefined
    const overlay = pushOverlay()
    const frame = requestAnimationFrame(() => menuItems(menuRef.current)[0]?.focus({ preventScroll: true }))
    function onKeyDown(event) {
      if (event.key === 'Escape' && isTopOverlay(overlay.id)) {
        event.stopPropagation()
        setOpenState(false)
        onOpenChangeRef.current?.(false)
        triggerRef.current?.querySelector('button, a, [tabindex]')?.focus({ preventScroll: true })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      overlay.release()
    }
  }, [open])

  function handleMenuKeyDown(event) {
    const items = menuItems(menuRef.current)
    const index = items.indexOf(document.activeElement)
    let next = null
    if (event.key === 'ArrowDown') next = items[(index + 1) % items.length]
    else if (event.key === 'ArrowUp') next = items[(index - 1 + items.length) % items.length]
    else if (event.key === 'Home') next = items[0]
    else if (event.key === 'End') next = items[items.length - 1]
    else if (event.key === 'Tab') close({ restoreFocus: false })
    if (next) {
      event.preventDefault()
      next.focus()
    }
  }

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger, {
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: (event) => {
          trigger.props.onClick?.(event)
          // Keep the click away from clickable rows / cards behind the button.
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
              ref={menuRef}
              id={menuId}
              role="menu"
              variants={popIn}
              initial="hidden"
              animate="show"
              exit="exit"
              onKeyDown={handleMenuKeyDown}
              onClick={(event) => event.stopPropagation()}
              style={{ width }}
              className={cn(
                'fixed left-0 top-0 z-[60] max-h-[min(24rem,calc(100dvh-1rem))] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-pop',
                className,
              )}
            >
              <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )
}

const ITEM_TONES = {
  default: 'text-fg hover:bg-surface-2 focus-visible:bg-surface-2 [&_svg]:text-fg-subtle',
  danger: 'text-danger-fg hover:bg-danger-soft focus-visible:bg-danger-soft [&_svg]:text-danger-fg',
}

export function DropdownItem({ icon, onSelect, to, tone = 'default', disabled, shortcut, closeOnSelect = true, className, children }) {
  const { close } = useContext(MenuContext)
  const navigate = useNavigate()

  function select() {
    if (disabled) return
    if (closeOnSelect) close({ restoreFocus: !to })
    if (to) navigate(to)
    onSelect?.()
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      onClick={select}
      className={cn(
        'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm outline-none transition-colors',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        ITEM_TONES[tone] ?? ITEM_TONES.default,
        disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
        className,
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <span className="ml-auto pl-3 text-xs text-fg-subtle">{shortcut}</span>}
    </button>
  )
}

export function DropdownLabel({ className, children }) {
  return <div className={cn('px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle', className)}>{children}</div>
}

export function DropdownSeparator({ className }) {
  return <div role="separator" className={cn('-mx-1.5 my-1.5 h-px bg-line', className)} />
}
