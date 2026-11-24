// useDebouncedValue() and useDebouncedCallback(): wait until typing stops before searching.
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 *   const search = useDebouncedValue(input, 300)
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/**
 * Returns a function that calls `callback` once calls have stopped for `delay` ms.
 * The newest callback is always used, so it never needs to be memoised.
 */
export function useDebouncedCallback(callback, delay = 300) {
  const callbackRef = useRef(callback)
  const timerRef = useRef(null)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return useCallback(
    (...args) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay)
    },
    [delay],
  )
}
