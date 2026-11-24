// useMediaQuery() and useBreakpoint(): react to screen size (phone / tablet / desktop).
import { useCallback, useSyncExternalStore } from 'react'

/** Live result of a CSS media query: useMediaQuery('(min-width: 1024px)') */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/**
 * Screen class, matching Tailwind's breakpoints:
 * phone < 768px (md) · tablet 768–1023px · desktop >= 1024px (lg)
 */
export function useBreakpoint() {
  const isTabletUp = useMediaQuery('(min-width: 768px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return { isMobile: !isTabletUp, isTablet: isTabletUp && !isDesktop, isDesktop }
}
