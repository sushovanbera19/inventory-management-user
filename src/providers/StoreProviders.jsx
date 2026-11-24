// Providers for the shop: data cache, theme, toasts, confirm dialogs, router, customer, cart and wishlist.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { UNAUTHORIZED_EVENT, authApi, clearSession, getSession, setSession } from '@/api'
import { STORAGE_KEYS } from '@/config/app'
import { AuthContext, CartContext, ThemeContext, WishlistContext } from '@/context/StoreContexts'
import { useToast } from '@/context/ToastContext'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { ConfirmProvider } from './ConfirmProvider.jsx'
import { ToastProvider } from './ToastProvider.jsx'

export function StoreProviders({ children }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: (count, error) => count < 1 && (error?.status ?? 500) >= 500 } } }))
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <ToastProvider>
            <ConfirmProvider>
              <BrowserRouter>
                <AuthProvider>
                  <WishlistProvider>
                    <CartProvider>{children}</CartProvider>
                  </WishlistProvider>
                </AuthProvider>
              </BrowserRouter>
            </ConfirmProvider>
          </ToastProvider>
        </MotionConfig>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.theme, 'light')
  const dark = theme === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const toggle = useCallback(
    (event) => {
      const next = dark ? 'light' : 'dark'
      const apply = () => {
        flushSync(() => setTheme(next))
        document.documentElement.classList.toggle('dark', next === 'dark')
      }
      if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return apply()
      const x = event?.clientX || innerWidth / 2
      const y = event?.clientY || innerHeight / 2
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      document
        .startViewTransition(apply)
        .ready.then(() =>
          document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, { duration: 450, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }),
        )
        .catch(() => {})
    },
    [dark, setTheme],
  )

  const value = useMemo(() => ({ dark, toggle }), [dark, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [state, setState] = useState(() => {
    const session = getSession()
    return { user: session?.user ?? null, isLoading: Boolean(session) }
  })

  useEffect(() => {
    if (!getSession()) return undefined
    let cancelled = false
    authApi
      .me()
      .then((user) => !cancelled && setState({ user, isLoading: false }))
      .catch(() => {
        clearSession()
        if (!cancelled) setState({ user: null, isLoading: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession()
      setState({ user: null, isLoading: false })
      toast.warning('Please sign in again')
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [toast])

  const start = useCallback((session) => {
    setSession(session)
    setState({ user: session.user, isLoading: false })
    return session.user
  }, [])
  const login = useCallback(async (credentials) => start(await authApi.login(credentials)), [start])
  const register = useCallback(async (data) => start(await authApi.register(data)), [start])
  const logout = useCallback(() => {
    clearSession()
    queryClient.removeQueries({ queryKey: ['orders'] })
    setState({ user: null, isLoading: false })
  }, [queryClient])
  const setUser = useCallback((user) => {
    const session = getSession()
    if (session) setSession({ ...session, user })
    setState((current) => ({ ...current, user }))
  }, [])

  const value = useMemo(() => ({ ...state, isAuthenticated: Boolean(state.user), login, register, logout, setUser }), [state, login, register, logout, setUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Cart lines keep a copy of the product's name, price and picture so the cart renders instantly. */
function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage(STORAGE_KEYS.cart, [])
  const [isOpen, setOpen] = useState(false)
  const toast = useToast()

  const add = useCallback(
    (product, quantity = 1, { silent = false } = {}) => {
      setItems((current) => {
        const existing = current.find((item) => item.productId === product.id)
        if (existing) return current.map((item) => (item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item))
        return [...current, { productId: product.id, slug: product.slug, name: product.name, sku: product.sku, price: product.price, compareAtPrice: product.compareAtPrice, imageUrl: product.imageUrl, stock: product.stock, unit: product.unit, quantity: Math.min(quantity, product.stock) }]
      })
      if (!silent) {
        toast.success('Added to cart', { description: product.name, action: { label: 'View cart', onClick: () => setOpen(true) } })
      }
    },
    [setItems, toast],
  )
  const update = useCallback((productId, quantity) => setItems((current) => current.map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) } : item))), [setItems])
  const remove = useCallback((productId) => setItems((current) => current.filter((item) => item.productId !== productId)), [setItems])
  const clear = useCallback(() => setItems([]), [setItems])

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return { items, count, subtotal, add, update, remove, clear, isOpen, open: () => setOpen(true), close: () => setOpen(false) }
  }, [items, add, update, remove, clear, isOpen])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

function WishlistProvider({ children }) {
  const [ids, setIds] = useLocalStorage(STORAGE_KEYS.wishlist, [])
  const toast = useToast()

  const toggle = useCallback(
    (product) => {
      const saved = ids.includes(product.id)
      setIds(saved ? ids.filter((id) => id !== product.id) : [...ids, product.id])
      toast.info(saved ? 'Removed from wishlist' : 'Saved to wishlist', { description: product.name, duration: 2500 })
    },
    [ids, setIds, toast],
  )
  const value = useMemo(() => ({ ids, has: (id) => ids.includes(id), toggle, remove: (id) => setIds(ids.filter((item) => item !== id)) }), [ids, toggle, setIds])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
