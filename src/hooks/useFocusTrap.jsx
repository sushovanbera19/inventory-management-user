// useFocusTrap(): keeps keyboard focus inside a modal or drawer and restores it when closed.
import { useEffect } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function visibleFocusables(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter(
    (element) => element.offsetParent !== null || element === document.activeElement,
  )
}

/**
 * Keeps keyboard focus inside `containerRef` while `active` (modals, drawers):
 * - focuses the element marked data-autofocus, else the first focusable one
 * - Tab / Shift+Tab cycle inside the container
 * - gives focus back to whatever had it when the trap ends
 */
export function useFocusTrap(containerRef, active = true) {
  useEffect(() => {
    const container = containerRef.current
    if (!active || !container) return undefined

    const previouslyFocused = document.activeElement

    const frame = requestAnimationFrame(() => {
      if (container.contains(document.activeElement)) return
      const target =
        container.querySelector('[data-autofocus]') ?? visibleFocusables(container)[0] ?? container
      target.focus({ preventScroll: true })
    })

    function onKeyDown(event) {
      if (event.key !== 'Tab') return
      const items = visibleFocusables(container)
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      container.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [active, containerRef])
}
