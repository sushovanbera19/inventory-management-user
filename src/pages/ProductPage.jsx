// Product page: zoomable image, price, stock, quantity, add to cart / buy now, details, reviews, related products.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronRight, PackageSearch, RotateCcw, Share2, ShieldCheck, ShoppingBag, Star, Truck, Zap } from 'lucide-react'
import { Carousel } from '@/components/effects/Effects'
import { Price, ProductBadges, ProductCard, Rating, SectionHeading, WishlistButton } from '@/components/store/ProductBits'
import { flyToCart } from '@/lib/flyToCart'
import { Badge, Button, EmptyState, QuantityStepper, Reveal, Tabs } from '@/components/ui'
import { FREE_SHIPPING_FROM, STORAGE_KEYS } from '@/config/app'
import { useCart } from '@/context/StoreContexts'
import { useToast } from '@/context/ToastContext'
import { readStorage, writeStorage } from '@/lib/storage'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/cn'
import { formatCurrency, formatDate } from '@/lib/format'
import { useProduct } from '@/queries'

// Four views of the product picture for the gallery (a real backend would send several photos).
const GALLERY = [
  { label: 'Front view', style: {} },
  { label: 'Close-up', style: { transform: 'scale(1.5)', transformOrigin: '50% 40%' } },
  { label: 'Tilted view', style: { transform: 'rotate(-8deg) scale(1.15)' } },
  { label: 'Colour detail', style: { filter: 'saturate(1.6) hue-rotate(-12deg)' } },
]

export default function ProductPage() {
  const { slug } = useParams()
  const { data: product, isLoading, error } = useProduct(slug)
  usePageTitle(product?.name)

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="skeleton aspect-square rounded-3xl" />
        <div className="space-y-4"><div className="skeleton h-8 w-3/4" /><div className="skeleton h-5 w-1/3" /><div className="skeleton h-10 w-1/2" /><div className="skeleton h-32" /></div>
      </div>
    )
  }
  if (error || !product) return <div className="mx-auto max-w-7xl px-4 py-16"><EmptyState icon={<PackageSearch />} title="Product not found" description="It may have been removed." action={<Button to="/shop">Back to shop</Button>} /></div>
  return <ProductView key={product.id} product={product} />
}

function ProductView({ product }) {
  const cart = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState('details')
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 })
  const [added, setAdded] = useState(false)
  const [view, setView] = useState(0)
  const [showBar, setShowBar] = useState(false)
  const imageRef = useRef(null)
  const buyRef = useRef(null)

  // Show the sticky buy bar once the main buttons scroll out of view.
  useEffect(() => {
    const target = buyRef.current
    if (!target) return undefined
    const observer = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    observer.observe(target)
    return () => observer.disconnect()
  }, [])
  // Remember recently viewed products (shown on the cart page).
  useEffect(() => {
    const current = readStorage(STORAGE_KEYS.recent, [])
    writeStorage(STORAGE_KEYS.recent, [product.slug, ...current.filter((slug) => slug !== product.slug)].slice(0, 8))
  }, [product.slug])

  function addToCart() {
    flyToCart(imageRef.current)
    cart.add(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  function buyNow() {
    cart.add(product, quantity, { silent: true })
    navigate('/checkout')
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: product.reviews.filter((review) => review.rating === stars).length }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-fg-subtle" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-fg">Home</Link><ChevronRight className="size-4" />
        <Link to={`/category/${product.category.slug}`} className="hover:text-fg">{product.category.name}</Link><ChevronRight className="size-4" />
        <span className="truncate text-fg">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="relative aspect-square cursor-zoom-in overflow-hidden rounded-[2rem] border border-line bg-surface shadow-raised"
            onPointerEnter={() => setZoom((current) => ({ ...current, active: true }))}
            onPointerLeave={() => setZoom({ active: false, x: 50, y: 50 })}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              setZoom({ active: true, x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 })
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={view}
                ref={imageRef}
                src={product.imageUrl}
                alt={product.name}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="size-full object-cover"
                style={{ ...GALLERY[view].style, transform: zoom.active ? `scale(1.8) ${GALLERY[view].style.transform ?? ''}` : GALLERY[view].style.transform, transformOrigin: `${zoom.x}% ${zoom.y}%`, transition: 'transform 0.2s ease-out' }}
              />
            </AnimatePresence>
            <ProductBadges badges={product.badges} className="absolute left-4 top-4" />
            <WishlistButton product={product} className="absolute right-4 top-4 size-11" />
            <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-fg/70 px-3 py-1 text-xs font-medium text-bg backdrop-blur transition-opacity duration-300" style={{ opacity: zoom.active ? 0 : 1 }}>Hover to zoom</span>
          </div>
          {/* Gallery: different views of the same picture. */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {GALLERY.map((item, index) => (
              <motion.button key={item.label} type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} aria-label={item.label} aria-pressed={view === index} onClick={() => setView(index)}
                className={cn('relative aspect-square overflow-hidden rounded-2xl border-2 bg-surface transition-colors', view === index ? 'border-brand-500 shadow-glow-sm' : 'border-line hover:border-line-strong')}>
                <img src={product.imageUrl} alt="" className="size-full object-cover" style={item.style} />
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
          <Link to={`/category/${product.category.slug}`} className="text-sm font-semibold text-brand-fg">{product.category.name}</Link>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Rating value={product.rating} size="lg" />
            <a href="#reviews" onClick={() => setTab('reviews')} className="text-fg-muted hover:text-fg">{product.rating} · {product.reviewCount} reviews</a>
            <span className="text-fg-subtle">·</span>
            <span className="text-fg-muted">{product.soldCount}+ sold</span>
          </div>

          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" className="mt-6" />
          <p className="mt-1 text-xs text-fg-subtle">Inclusive of all taxes · per {product.unit}</p>

          <div className="mt-5">
            {product.inStock ? (
              <Badge tone={product.stock <= 10 ? 'warning' : 'success'} dot pulse>{product.stock <= 10 ? `Hurry, only ${product.stock} left` : 'In stock, ready to ship'}</Badge>
            ) : (
              <Badge tone="danger">Out of stock</Badge>
            )}
          </div>

          <p className="mt-6 text-fg-muted">{product.description}</p>
          <ul className="mt-4 space-y-2">
            {product.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm"><Check className="size-4 text-success" />{feature}</li>
            ))}
          </ul>

          <div ref={buyRef} className="mt-8 flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} min={1} max={Math.max(1, product.stock)} onChange={setQuantity} disabled={!product.inStock} aria-label="Quantity" />
            <Button size="lg" className="min-w-44 flex-1" disabled={!product.inStock} onClick={addToCart} leftIcon={added ? <Check /> : <ShoppingBag />} variant={added ? 'success' : 'primary'}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={String(added)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>{added ? 'Added!' : 'Add to cart'}</motion.span>
              </AnimatePresence>
            </Button>
            <Button size="lg" variant="secondary" disabled={!product.inStock} onClick={buyNow} leftIcon={<Zap />}>Buy now</Button>
            <Button size="lg" variant="ghost" onClick={share} aria-label="Share"><Share2 /></Button>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-3">
            {[[Truck, product.price >= FREE_SHIPPING_FROM ? 'Free delivery' : `Free over ${formatCurrency(FREE_SHIPPING_FROM)}`, 'Arrives in 2–5 days'], [RotateCcw, '7-day returns', 'Hassle-free'], [ShieldCheck, 'Secure payment', 'UPI · Card · COD']].map(([Icon, title, text]) => (
              <div key={title} className="flex items-center gap-2.5"><Icon className="size-5 shrink-0 text-brand-fg" /><span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-fg-subtle">{text}</span></span></div>
            ))}
          </div>
        </motion.div>
      </div>

      <section id="reviews" className="mt-16 scroll-mt-24">
        <Tabs value={tab} onChange={setTab} items={[{ value: 'details', label: 'Details' }, { value: 'reviews', label: 'Reviews', count: product.reviewCount }, { value: 'shipping', label: 'Shipping & returns' }]} />
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-8">
            {tab === 'details' && (
              <dl className="grid max-w-2xl divide-y divide-line rounded-2xl border border-line bg-surface">
                {product.specs.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-2 px-5 py-3 text-sm"><dt className="text-fg-muted">{label}</dt><dd className="font-medium">{value}</dd></div>
                ))}
              </dl>
            )}
            {tab === 'reviews' && (
              <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                <div className="rounded-2xl border border-line bg-surface p-6 text-center">
                  <p className="font-display text-5xl font-bold">{product.rating}</p>
                  <Rating value={product.rating} size="lg" className="mt-2 justify-center" />
                  <p className="mt-1 text-sm text-fg-subtle">{product.reviewCount} reviews</p>
                  <div className="mt-5 space-y-1.5">
                    {breakdown.map((row) => (
                      <div key={row.stars} className="flex items-center gap-2 text-xs">
                        <span className="w-6">{row.stars}<Star className="inline size-3 fill-amber-400 text-amber-400" /></span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3"><motion.div className="h-full rounded-full bg-amber-400" initial={{ width: 0 }} animate={{ width: `${(row.count / product.reviews.length) * 100}%` }} transition={{ duration: 0.6 }} /></div>
                        <span className="w-4 text-fg-subtle">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ul className="space-y-4">
                  {product.reviews.map((review) => (
                    <li key={review.id} className="rounded-2xl border border-line bg-surface p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2"><Rating value={review.rating} /><span className="text-xs text-fg-subtle">{formatDate(review.createdAt)}</span></div>
                      <p className="mt-2 font-semibold">{review.title}</p>
                      <p className="mt-1 text-sm text-fg-muted">{review.body}</p>
                      <p className="mt-3 text-xs text-fg-subtle">{review.author}{review.verified && <span className="ml-2 font-medium text-success-fg">✓ Verified purchase</span>}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tab === 'shipping' && (
              <div className="max-w-2xl space-y-3 text-fg-muted">
                <p><b className="text-fg">Delivery:</b> orders ship from Pune within 24 hours and arrive in 2–5 working days. Delivery is free on orders over {formatCurrency(FREE_SHIPPING_FROM)}.</p>
                <p><b className="text-fg">Returns:</b> return any unused item in its original packaging within 7 days of delivery for a full refund.</p>
                <p><b className="text-fg">Cash on delivery:</b> available on all orders.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {product.related.length > 0 && (
        <Reveal className="mt-8">
          <SectionHeading title="You may also like" />
          <Carousel label="Related products">{product.related.map((item) => <ProductCard key={item.id} product={item} />)}</Carousel>
        </Reveal>
      )}
      <AnimatePresence>
        {showBar && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line shadow-pop">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <img src={product.imageUrl} alt="" className="size-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{product.name}</p><p className="text-sm font-bold">{formatCurrency(product.price)}</p></div>
              <Button disabled={!product.inStock} leftIcon={<ShoppingBag />} onClick={addToCart}>Add to cart</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
