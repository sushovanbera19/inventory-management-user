// useKeyboardShortcut(): global shortcuts such as Ctrl/Cmd+K and Escape.
import { useEffect, useRef } from 'react'

function isEditable(target) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

/**
 * Global keyboard shortcut.
 *   useKeyboardShortcut('mod+k', openPalette)     // Ctrl+K on Windows/Linux, ⌘K on macOS
 *   useKeyboardShortcut('escape', close, { enabled: isOpen, allowInInputs: true })
 *   useKeyboardShortcut('/', focusSearch)         // ignored while the user is typing in a field
 */
export function useKeyboardShortcut(combo, handler, { enabled = true, allowInInputs = false } = {}) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!enabled) return undefined

    const parts = combo.toLowerCase().split('+')
    const key = parts[parts.length - 1]
    const needsMod = parts.includes('mod')
    const needsShift = parts.includes('shift')
    const needsAlt = parts.includes('alt')

    function onKeyDown(event) {
      if (!event.key || event.key.toLowerCase() !== key) return
      if (needsMod !== (event.ctrlKey || event.metaKey)) return
      if (needsAlt !== event.altKey) return
      if (needsShift && !event.shiftKey) return
      // Plain keys must not fire while the user is typing; Ctrl/⌘ combos always may.
      if (!allowInInputs && !needsMod && isEditable(event.target)) return
      handlerRef.current(event)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [combo, enabled, allowInInputs])
}
