// useFloating(): positions menus, popovers and tooltips next to their trigger, flipping and staying on screen.
import { useLayoutEffect } from 'react'

const MARGIN = 8

/**
 * Places a floating element (menu, popover, tooltip) next to its trigger with `position: fixed`,
 * so containers with overflow (tables, cards) can never clip it. It flips to the other side when
 * there is no room, stays inside the viewport, and follows the trigger on scroll and resize.
 *
 * The position is written straight onto the element's style, so moving it never re-renders React.
 * side: 'top' | 'bottom' | 'left' | 'right' · align: 'start' | 'center' | 'end'
 */
export function useFloating({ open, triggerRef, floatingRef, side = 'bottom', align = 'start', offset = 8, matchWidth = false }) {
  useLayoutEffect(() => {
    if (!open) return undefined

    function update() {
      const trigger = triggerRef.current
      const floating = floatingRef.current
      if (!trigger || !floating) return

      const anchor = trigger.getBoundingClientRect()
      // Dropdown lists of a search field are exactly as wide as the field.
      if (matchWidth) floating.style.width = `${Math.round(anchor.width)}px`
      // offsetWidth / offsetHeight ignore the scale of the entrance animation.
      const width = floating.offsetWidth
      const height = floating.offsetHeight
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let placed
      let top
      let left

      if (side === 'top' || side === 'bottom') {
        const below = anchor.bottom + offset
        const above = anchor.top - offset - height
        const fitsBelow = below + height <= viewportHeight - MARGIN
        const fitsAbove = above >= MARGIN
        placed = side === 'bottom' ? (fitsBelow || !fitsAbove ? 'bottom' : 'top') : fitsAbove || !fitsBelow ? 'top' : 'bottom'
        top = placed === 'bottom' ? below : above
        left = align === 'end' ? anchor.right - width : align === 'center' ? anchor.left + anchor.width / 2 - width / 2 : anchor.left
      } else {
        const right = anchor.right + offset
        const leftSide = anchor.left - offset - width
        placed = side === 'right' ? (right + width <= viewportWidth - MARGIN ? 'right' : 'left') : leftSide >= MARGIN ? 'left' : 'right'
        left = placed === 'right' ? right : leftSide
        top = anchor.top + anchor.height / 2 - height / 2
      }

      left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, viewportWidth - width - MARGIN))
      top = Math.min(Math.max(top, MARGIN), Math.max(MARGIN, viewportHeight - height - MARGIN))

      floating.style.top = `${Math.round(top)}px`
      floating.style.left = `${Math.round(left)}px`
      floating.dataset.side = placed
      // The entrance animation grows out of the side that faces the trigger.
      const origins = { bottom: 'top', top: 'bottom', left: 'right', right: 'left' }
      const horizontal = align === 'end' ? 'right' : align === 'center' ? 'center' : 'left'
      floating.style.transformOrigin =
        placed === 'top' || placed === 'bottom' ? `${horizontal} ${origins[placed]}` : `${origins[placed]} center`
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    if (floatingRef.current) observer.observe(floatingRef.current)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [open, triggerRef, floatingRef, side, align, offset, matchWidth])
}
