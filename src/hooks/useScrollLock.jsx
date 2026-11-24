// useScrollLock(): stops the page behind an overlay from scrolling.
import { useEffect } from 'react'

// Several overlays can be open at once (a confirm on top of a modal),
// so the page unlocks only when the last one closes.
let activeLocks = 0

/** Stops the page behind an overlay from scrolling while `locked` is true. */
export function useScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return undefined

    const { body, documentElement } = document
    activeLocks += 1
    if (activeLocks === 1) {
      // Reserve the scrollbar's width so the layout does not jump sideways.
      const scrollbarWidth = window.innerWidth - documentElement.clientWidth
      body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      activeLocks -= 1
      if (activeLocks === 0) {
        body.style.overflow = ''
        body.style.paddingRight = ''
      }
    }
  }, [locked])
}
