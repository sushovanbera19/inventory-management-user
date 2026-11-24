// useLocalStorage(): useState that remembers its value in localStorage.
import { useEffect, useState } from 'react'
import { readStorage, writeStorage } from '@/lib/storage'

/**
 * useState that remembers its value in localStorage.
 *   const [view, setView] = useLocalStorage('products.view', 'table')
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStorage(key, initialValue))

  useEffect(() => {
    writeStorage(key, value)
  }, [key, value])

  return [value, setValue]
}
