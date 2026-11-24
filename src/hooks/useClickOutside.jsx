// useClickOutside(): call a function when the user presses outside given elements (closes menus).
import { useEffect, useRef } from 'react'

/**
 * Calls `handler` when the user presses outside every given element.
 * `refs` is one ref or an array of refs (e.g. a trigger and its floating menu).
 */
export function useClickOutside(refs, handler, enabled = true) {
  const latest = useRef({ refs, handler })

  useEffect(() => {
    latest.current = { refs, handler }
  })

  useEffect(() => {
    if (!enabled) return undefined

    function onPointerDown(event) {
      const { refs: currentRefs, handler: currentHandler } = latest.current
      const list = Array.isArray(currentRefs) ? currentRefs : [currentRefs]
      const inside = list.some((ref) => ref?.current && ref.current.contains(event.target))
      if (!inside) currentHandler(event)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [enabled])
}
