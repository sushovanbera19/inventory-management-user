// Gives the app a promise-based confirm() (see useConfirm) and renders the one shared dialog.
import { useCallback, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ConfirmContext } from '@/context/ConfirmContext'

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, options: {} })
  const resolverRef = useRef(null)

  const confirm = useCallback((options = {}) => {
    // A new question cancels one that is still open.
    resolverRef.current?.(false)
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setState({ open: true, options })
    })
  }, [])

  function answer(value) {
    resolverRef.current?.(value)
    resolverRef.current = null
    setState((current) => ({ ...current, open: false }))
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog {...state.options} open={state.open} onConfirm={() => answer(true)} onCancel={() => answer(false)} />
    </ConfirmContext.Provider>
  )
}
