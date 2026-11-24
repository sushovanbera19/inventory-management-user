// Portal: renders children at the end of <body>, above the page (used by overlays).
import { createPortal } from 'react-dom'

/** Renders children at the end of <body>, above the page (modals, menus, toasts, tooltips). */
export function Portal({ children }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
