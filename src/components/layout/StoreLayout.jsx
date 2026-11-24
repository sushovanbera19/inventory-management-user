// The frame around every shop page: announcement bar, sticky header, page area, footer and the cart drawer.
import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Heart, LogIn, Menu, Moon, Package, Search, ShoppingBag, Sun, Truck, UserRound, X } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { Drawer, PageLoader, Portal, Spinner } from '@/components/ui'
import { APP_NAME, FREE_SHIPPING_FROM } from '@/config/app'
import { useAuth, useCart, useTheme, useWishlist } from '@/context/StoreContexts'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useDebouncedValue } from '@/hooks/useDebounce'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import { pageTransition, spring } from '@/lib/motion'
import { useCategories, useSearch } from '@/queries'
import { BackToTop, ScrollProgress } from '@/components/effects/Effects'
import { CartDrawer } from './CartDrawer.jsx'
import { StoreFooter } from './StoreFooter.jsx'

const MESSAGES = [`Free delivery on orders over ${formatCurrency(FREE_SHIPPING_FROM)}`, 'Use code WELCOME10 for 10% off your first order', 'Easy 7-day returns on every order']

export function StoreLayout() {
  const location = useLocation()
  const outlet = useOutlet()

  // Braces matter: newer browsers return a Promise from scrollTo, and an effect may only return a cleanup function.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-bg">
      <ScrollProgress />
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={location.pathname} initial={pageTransition.hidden} animate={pageTransition.show} exit={pageTransition.exit}>
              {outlet}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      <StoreFooter />
      <CartDrawer />
      <BackToTop />
    </div>
  )
}

function AnnouncementBar() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIndex((value) => (value + 1) % MESSAGES.length), 4000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="relative h-9 overflow-hidden bg-gradient-brand text-center text-xs font-medium text-white sm:text-sm">
      <AnimatePresence mode="wait">
        <motion.p key={index} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0 grid place-items-center px-4">
          <span className="inline-flex items-center gap-2"><Truck className="size-4" />{MESSAGES[index]}</span>
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user } = useAuth()
  const cart = useCart()
  const wishlist = useWishlist()
  const { dark, toggle } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('sticky top-0 z-30 border-b transition-all duration-500', scrolled ? 'glass border-line shadow-card' : 'border-transparent bg-surface')}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-xl text-fg-muted hover:bg-surface-2 lg:hidden">
          <Menu className="size-5" />
        </button>
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <LogoMark size={34} />
          <span className="hidden font-display text-lg font-bold tracking-tight text-fg sm:block">{APP_NAME}</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          <CategoriesMenu />
          {[['/shop?sort=newest', 'New in'], ['/shop?badge=bestseller', 'Bestsellers'], ['/shop?onSale=true', 'Deals'], ['/track-order', 'Track order']].map(([to, label]) => (
            <NavLink key={label} to={to} className="mx-2 py-1 text-sm font-semibold text-fg-muted transition-colors link-underline hover:text-fg">
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden w-64 xl:block">
            <SearchBox />
          </div>
          <HeaderIcon label="Search" className="xl:hidden" onClick={() => setSearchOpen(true)}><Search /></HeaderIcon>
          <HeaderIcon label={dark ? 'Light theme' : 'Dark theme'} onClick={(event) => toggle(event)}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={String(dark)} initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} className="grid place-items-center">{dark ? <Moon /> : <Sun />}</motion.span>
            </AnimatePresence>
          </HeaderIcon>
          <HeaderIcon label="Wishlist" to="/wishlist" count={wishlist.ids.length} className="hidden sm:grid"><Heart /></HeaderIcon>
          <HeaderIcon label={user ? 'My account' : 'Sign in'} to={user ? '/account' : '/login'}>{user ? <UserRound /> : <LogIn />}</HeaderIcon>
          <HeaderIcon label="Cart" onClick={cart.open} count={cart.count} highlight cartTarget><ShoppingBag /></HeaderIcon>
        </div>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}

function HeaderIcon({ label, to, onClick, count, highlight, cartTarget, className, children }) {
  const content = (
    <>
      <span className="[&_svg]:size-5">{children}</span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring.bouncy} className={cn('absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-surface', highlight ? 'bg-brand-600' : 'bg-rose-500')}>
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  )
  const classes = cn('relative grid size-10 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg', className)
  return to ? (
    <Link to={to} aria-label={label} className={classes}>{content}</Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick} className={classes} data-cart-target={cartTarget ? '' : undefined}>{content}</button>
  )
}

function CategoriesMenu() {
  const [open, setOpen] = useState(false)
  const { data: categories } = useCategories()
  const ref = useRef(null)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setOpen(false)
  }
  useClickOutside(ref, () => setOpen(false), open)

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-expanded={open} onMouseEnter={() => setOpen(true)} onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg">
        Shop <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }} className="absolute left-0 top-full pt-2">
            <div className="grid w-[640px] grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-3 shadow-pop">
              {(categories ?? []).map((category) => (
                <Link key={category.slug} to={`/category/${category.slug}`} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-2">
                  <img src={category.imageUrl} alt="" className="size-12 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-fg">{category.name}</span>
                    <span className="block text-xs text-fg-subtle">{category.productCount} products · from {formatCurrency(category.startingPrice)}</span>
                  </span>
                </Link>
              ))}
              <Link to="/shop" className="col-span-2 mt-1 rounded-xl bg-brand-soft p-3 text-center text-sm font-semibold text-brand-fg hover:bg-brand-500/20">Browse all products →</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Search field with live suggestions; Enter opens the full results. */
function SearchBox({ autoFocus, onDone }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const debounced = useDebouncedValue(query, 200)
  const { data, isFetching } = useSearch(debounced)
  const navigate = useNavigate()
  const ref = useRef(null)
  useClickOutside(ref, () => setFocused(false), focused)
  const show = focused && query.trim().length >= 2

  function submit(event) {
    event.preventDefault()
    if (!query.trim()) return
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`)
    setFocused(false)
    onDone?.()
  }

  return (
    <form ref={ref} onSubmit={submit} className="relative" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
      <input
        value={query}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
        className="h-10 w-full rounded-xl border border-line bg-surface-2/70 pl-9 pr-9 text-base outline-none transition-[border-color,box-shadow] placeholder:text-fg-subtle focus:border-brand-500 focus:bg-surface focus:ring-4 focus:ring-brand-500/15 md:text-sm"
      />
      {isFetching && <Spinner size="sm" className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle" />}
      <AnimatePresence>
        {show && data && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 right-0 top-full z-50 mt-2 min-w-72 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-pop">
            {data.categories.map((category) => (
              <Link key={category.slug} to={`/category/${category.slug}`} onClick={() => { setFocused(false); onDone?.() }} className="block rounded-lg px-3 py-2 text-sm text-fg-muted hover:bg-surface-2">
                in <span className="font-semibold text-fg">{category.name}</span>
              </Link>
            ))}
            {data.products.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`} onClick={() => { setFocused(false); setQuery(''); onDone?.() }} className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-2">
                <img src={product.imageUrl} alt="" className="size-10 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</span>
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(product.price)}</span>
              </Link>
            ))}
            {!data.products.length && !data.categories.length && <p className="p-4 text-center text-sm text-fg-subtle">No products match “{query}”.</p>}
            <button type="submit" className="mt-1 w-full rounded-lg bg-surface-2 py-2 text-sm font-medium text-brand-fg">See all results</button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}

function SearchOverlay({ open, onClose }) {
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ y: -30 }} animate={{ y: 0 }} exit={{ y: -30 }} transition={spring.smooth} onClick={(event) => event.stopPropagation()} className="bg-surface p-4 shadow-pop">
              <div className="mx-auto flex max-w-2xl items-center gap-2">
                <div className="flex-1"><SearchBox autoFocus onDone={onClose} /></div>
                <button type="button" aria-label="Close search" onClick={onClose} className="grid size-10 place-items-center rounded-xl hover:bg-surface-2"><X className="size-5" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

function MobileMenu({ open, onClose }) {
  const { data: categories } = useCategories()
  const { user, logout } = useAuth()
  const link = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-fg hover:bg-surface-2'
  return (
    <Drawer open={open} onClose={onClose} side="left" size="sm" header={<span className="flex items-center gap-2.5"><LogoMark size={30} /><span className="font-display text-lg font-bold">{APP_NAME}</span></span>}>
      <nav className="space-y-6" onClick={(event) => event.target.closest('a') && onClose()}>
        <div className="space-y-1">
          <Link to="/" className={link}>Home</Link>
          <Link to="/shop" className={link}>All products</Link>
          <Link to="/shop?onSale=true" className={link}>Deals</Link>
          <Link to="/wishlist" className={link}><Heart className="size-4" />Wishlist</Link>
          <Link to="/track-order" className={link}><Package className="size-4" />Track order</Link>
        </div>
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Categories</p>
          {(categories ?? []).map((category) => (
            <Link key={category.slug} to={`/category/${category.slug}`} className={link}>
              <img src={category.imageUrl} alt="" className="size-8 rounded-lg object-cover" />
              {category.name}
            </Link>
          ))}
        </div>
        <div className="space-y-1 border-t border-line pt-4">
          {user ? (
            <>
              <Link to="/account" className={link}><UserRound className="size-4" />{user.name}</Link>
              <button type="button" onClick={() => { logout(); onClose() }} className={cn(link, 'w-full text-danger-fg')}>Sign out</button>
            </>
          ) : (
            <Link to="/login" className={link}><LogIn className="size-4" />Sign in / Register</Link>
          )}
        </div>
      </nav>
    </Drawer>
  )
}
