// Toast context + useToast(): show success / error / info / warning notifications.
import { createContext, useContext } from 'react'

/** Holds the toast API ({ success, error, info, warning, show, dismiss }). Filled by ToastProvider. */
export const ToastContext = createContext(null)

/**
 * Show short notifications at the edge of the screen.
 *   const toast = useToast()
 *   toast.success('Product saved')
 *   toast.error('Could not save', { description: error.message })
 *   toast.info('Copied', { action: { label: 'Undo', onClick: undo } })
 */
export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>.')
  return toast
}
