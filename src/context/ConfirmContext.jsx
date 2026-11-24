// Confirm context + useConfirm(): promise-based "Are you sure?" dialogs.
import { createContext, useContext } from 'react'

/** Holds the confirm() function. Filled by ConfirmProvider. */
export const ConfirmContext = createContext(null)

/**
 * Ask before doing something risky. Resolves to true (confirmed) or false (cancelled).
 *   const confirm = useConfirm()
 *   if (await confirm({ title: 'Delete product?', description: '…', confirmLabel: 'Delete', tone: 'danger' })) { … }
 */
export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>.')
  return confirm
}
