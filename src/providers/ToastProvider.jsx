// Keeps the list of visible toasts and gives the whole app the toast API (see useToast).
import { useCallback, useMemo, useState } from 'react'
import { Toaster } from '@/components/ui/Toaster'
import { ToastContext } from '@/context/ToastContext'

const MAX_VISIBLE = 4
let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(({ title, description, tone = 'info', duration = 4500, action } = {}) => {
    nextId += 1
    const id = `toast-${nextId}`
    // Newest first; the oldest drop off once there are too many.
    setToasts((current) => [{ id, title, description, tone, duration, action }, ...current].slice(0, MAX_VISIBLE))
    return id
  }, [])

  // One stable object, safe to use in dependency arrays.
  const api = useMemo(() => {
    const withTone = (tone) => (title, options = {}) => show({ ...options, title, tone })
    return {
      show,
      dismiss,
      success: withTone('success'),
      error: withTone('danger'),
      warning: withTone('warning'),
      info: withTone('info'),
    }
  }, [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
