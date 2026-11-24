// Shop building blocks: star rating, price with discount, badges, wishlist heart, the product card
// (3D tilt, glare, sliding action bar, quick view, fly-to-cart) and section headings.
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Eye, Heart, ShoppingBag, Star } from 'lucide-react'
import { TiltCard } from '@/components/effects/Effects'
import { useCart, useWishlist } from '@/context/StoreContexts'
import { cn } from '@/lib/cn'
import { categoryHex } from '@/lib/constants'
import { flyToCart } from '@/lib/flyToCart'
import { formatCurrency } from '@/lib/format'
import { fadeUp, spring } from '@/lib/motion'
import { QuickView } from './QuickView.jsx'

export function Rating({ value = 0, count, size = 'sm', className }) {
  const px = size === 'lg' ? 'size-5' : 'size-3.5'
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={`Rated ${value} out of 5`}>
      <span className="flex">
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.max(0, Math.min(1, value - index))
          return (
            <span key={index} className={cn('relative', px)}>
              <Star className={cn('absolute inset-0 text-line-strong', px)} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn('text-amber-400', px)} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          )
        })}
      </span>
      {count != null && <span className="text-xs text-fg-subtle">({count})</span>}
    </span>
  )
}

export function Price({ price, compareAtPrice, size = 'md', className }) {
  const off = compareAtPrice ? Math.round((1 - price / compareAtPrice) * 100) : 0
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={cn('font-display font-bold tabular-nums text-fg', size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-base' : 'text-lg')}>{formatCurrency(price)}</span>
      {compareAtPrice && (
        <>
          <span className="text-sm text-fg-subtle line-through tabular-nums">{formatCurrency(compareAtPrice)}</span>
          <span className="rounded-md bg-success-soft px-1.5 py-0.5 text-[11px] font-bold text-success-fg">{off}% OFF</span>
        </>
      )}
    </span>
  )
}

const BADGES = {
  sale: { label: 'Sale', className: 'bg-linear-to-r from-rose-500 to-pink-500 text-white' },
  bestseller: { label: '★ Bestseller', className: 'bg-linear-to-r from-amber-300 to-amber-500 text-amber-950' },
  new: { label: 'New', className: 'bg-linear-to-r from-brand-500 to-fuchsia-500 text-white' },
}

export function ProductBadges({ badges = [], className }) {
  return (
    <div className={cn('flex flex-col items-start gap-1.5', className)}>
      {badges.slice(0, 2).map((badge, index) => (
        <motion.span key={badge} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 + index * 0.08 }} className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md', BADGES[badge]?.className)}>
          {BADGES[badge]?.label}
        </motion.span>
      ))}
    </div>
  )
}

export function WishlistButton({ product, className }) {
  const wishlist = useWishlist()
  const saved = wishlist.has(product.id)
  const [burst, setBurst] = useState(0)
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.85 }}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!saved) setBurst((value) => value + 1)
        wishlist.toggle(product)
      }}
      className={cn('relative grid size-10 place-items-center rounded-full bg-surface/90 shadow-lg backdrop-blur transition-colors hover:bg-surface', className)}
    >
      <motion.span key={String(saved)} initial={{ scale: saved ? 0.3 : 1 }} animate={{ scale: 1 }} transition={spring.bouncy}>
        <Heart className={cn('size-[18px]', saved ? 'fill-rose-500 text-rose-500' : 'text-fg-muted')} />
      </motion.span>
      {/* A little burst of hearts when saving. */}
      <AnimatePresence>
        {burst > 0 && saved && (
          <span key={burst} className="pointer-events-none absolute inset-0">
            {Array.from({ length: 6 }, (_, index) => {
              const angle = (index / 6) * Math.PI * 2
              return (
                <motion.span key={index} className="absolute left-1/2 top-1/2 size-1.5 rounded-full bg-rose-500" initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(angle) * 22, y: Math.sin(angle) * 22, opacity: 0 }} transition={{ duration: 0.55 }} />
              )
            })}
          </span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/** The product tile used in every grid and carousel. */
export function ProductCard({ product, className }) {
  const cart = useCart()
  const imageRef = useRef(null)
  const [quickView, setQuickView] = useState(false)
  const color = categoryHex(product.category?.color)

  function addToCart(event) {
    event.preventDefault()
    event.stopPropagation()
    flyToCart(imageRef.current)
    cart.add(product)
  }

  return (
    <motion.div variants={fadeUp} className={cn('h-full', className)}>
      <TiltCard max={6} className="h-full rounded-3xl">
        <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-card transition-[box-shadow,border-color] duration-500 group-hover/tilt:border-transparent group-hover/tilt:shadow-[0_30px_60px_-20px_var(--glow)]" style={{ '--glow': `color-mix(in oklab, ${color} 55%, transparent)` }}>
          <Link to={`/product/${product.slug}`} className="group/img relative block aspect-[4/5] overflow-hidden" style={{ background: `radial-gradient(circle at 50% 40%, color-mix(in oklab, ${color} 22%, var(--surface)), var(--surface-2))` }}>
            {product.imageUrl && (
              <img
                ref={imageRef}
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover/tilt:scale-110 group-hover/tilt:-rotate-2"
              />
            )}
            <ProductBadges badges={product.badges} className="absolute left-3 top-3 z-10" />
            {!product.inStock && <span className="absolute inset-0 z-10 grid place-items-center bg-fg/40 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-[2px]">Sold out</span>}

            {/* Action bar: slides up on hover (always visible on touch screens). */}
            <div className="absolute inset-x-3 bottom-3 z-10 flex translate-y-0 gap-2 opacity-100 transition-all duration-500 ease-out [@media(hover:hover)]:translate-y-[130%] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/tilt:translate-y-0 [@media(hover:hover)]:group-hover/tilt:opacity-100">
              <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setQuickView(true) }} aria-label={`Quick view ${product.name}`} className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface/95 text-fg shadow-lg backdrop-blur transition-colors hover:bg-surface">
                <Eye className="size-[18px]" />
              </button>
              <button type="button" disabled={!product.inStock} onClick={addToCart} className="relative flex h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-brand text-sm font-semibold text-white shadow-glow-sm shine-on-hover transition-[filter] hover:brightness-110 disabled:opacity-50">
                <ShoppingBag className="size-4" /> Add to cart
              </button>
            </div>
          </Link>
          <WishlistButton product={product} className="absolute right-3 top-3 z-10" />

          <div className="flex flex-1 flex-col p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
                {product.category?.name}
              </span>
              <Rating value={product.rating} />
            </div>
            <Link to={`/product/${product.slug}`} className="mt-1.5 line-clamp-2 min-h-10 text-[15px] font-semibold leading-5 text-fg transition-colors hover:text-brand-fg">
              {product.name}
            </Link>
            <div className="mt-auto flex items-end justify-between gap-2 pt-3">
              <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" className="flex-col gap-0.5" />
              {product.inStock && product.stock <= 10 && <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning-fg">Only {product.stock} left</span>}
            </div>
          </div>
        </article>
      </TiltCard>
      <QuickView product={product} open={quickView} onClose={() => setQuickView(false)} />
    </motion.div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="skeleton aspect-[4/5] rounded-none" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton mt-4 h-5 w-1/3" />
      </div>
    </div>
  )
}

export function SectionHeading({ eyebrow, title, description, action, className, align = 'left' }) {
  return (
    <div className={cn('mb-10 flex flex-wrap items-end justify-between gap-4', align === 'center' && 'flex-col items-center text-center', className)}>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="max-w-2xl">
        {eyebrow && (
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-fg">
            <span className="h-px w-8 bg-linear-to-r from-transparent to-brand-500" />
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl lg:text-5xl">{title}</h2>
        {description && <p className="mt-3 text-lg text-fg-muted">{description}</p>}
      </motion.div>
      {action}
    </div>
  )
}

export function SeeAllLink({ to, children = 'See all' }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold shadow-card transition-all hover:border-brand-500 hover:bg-brand-600 hover:text-white hover:shadow-glow-sm">
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}
