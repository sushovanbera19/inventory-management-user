// useQueryState(): keeps list state (page, filters, sort) in the URL so refresh and sharing keep the view.
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Keeps list state (page, search, filters, sort) in the URL query string, so a
 * filtered list survives a refresh, the Back button and sharing the link.
 *
 *   const [query, setQuery] = useQueryState({
 *     page: 1, pageSize: 10, search: '', status: 'all', sortBy: 'createdAt', sortDir: 'desc',
 *   })
 *   setQuery({ status: 'pending' })   // changing a filter goes back to page 1 automatically
 *   setQuery({ page: 3 })
 *
 * Values equal to their default are left out of the URL. Numbers and booleans
 * are parsed back to the type of their default. Other query params are kept.
 */
export function useQueryState(defaults) {
  const [searchParams, setSearchParams] = useSearchParams()
  // `defaults` is usually an inline object, so compare it by content, not identity.
  const defaultsKey = JSON.stringify(defaults)

  const state = useMemo(() => {
    const base = JSON.parse(defaultsKey)
    const result = {}
    for (const [key, fallback] of Object.entries(base)) {
      const raw = searchParams.get(key)
      if (raw == null) {
        result[key] = fallback
      } else if (typeof fallback === 'number') {
        const parsed = Number(raw)
        result[key] = Number.isFinite(parsed) ? parsed : fallback
      } else if (typeof fallback === 'boolean') {
        result[key] = raw === 'true'
      } else {
        result[key] = raw
      }
    }
    return result
  }, [searchParams, defaultsKey])

  const setState = useCallback(
    (patch, { replace = true } = {}) => {
      setSearchParams(
        (current) => {
          const base = JSON.parse(defaultsKey)
          const next = new URLSearchParams(current)
          const changes = { ...patch }
          if ('page' in base && !('page' in changes)) changes.page = base.page
          for (const [key, value] of Object.entries(changes)) {
            if (value == null || value === '' || String(value) === String(base[key])) next.delete(key)
            else next.set(key, String(value))
          }
          return next
        },
        { replace },
      )
    },
    [setSearchParams, defaultsKey],
  )

  return [state, setState]
}
