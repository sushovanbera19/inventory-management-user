// useDisclosure(): open / close / toggle state for modals, drawers and menus.
import { useCallback, useState } from 'react'

/**
 * Open / closed state for modals, drawers and menus.
 *   const dialog = useDisclosure()
 *   <Button onClick={dialog.open} />  <Modal open={dialog.isOpen} onClose={dialog.close} />
 */
export function useDisclosure(initial = false) {
  const [isOpen, setOpen] = useState(initial)
  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((value) => !value), [])
  return { isOpen, open, close, toggle, setOpen }
}
