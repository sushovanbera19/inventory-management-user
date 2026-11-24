// List view of a product: wide row with picture, details, description and actions.
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Check, Eye, ShoppingBag, Truck } from 'lucide-react'
import { useCart } from '@/context/StoreContexts'
import { cn } from '@/lib/cn'
import { categoryHex } from '@/lib/constants'
import { flyToCart } from '@/lib/flyToCart'
import { fadeUp } from '@/lib/motion'
import { Price, ProductBadges, Rating, WishlistButton } from './ProductBits.jsx'
import { QuickView } from './QuickView.jsx'

export function ProductListItem({ product }) {
  const cart = useCart()
  const imageRef = useRef(null)
  const [quickView, setQuickView] = useState(false)
  const color = categoryHex(product.category?.color)

  return (
    <motion.article variants={fadeUp} whileHover={{ y: -3 }} className="group relative flex overflow-hidden rounded-3xl border border-line bg-surface shadow-card transition-shadow duration-500 hover:shadow-raised">
      <Link to={`/product/${product.slug}`} className="relative w-28 shrink-0 overflow-hidden sm:w-56 lg:w-64" style={{ background: `radial-gradient(circle at 50% 40%, color-mix(in oklab, ${color} 22%, var(--surface)), var(--surface-2))` }}>
        <img ref={imageRef} src={product.imageUrl} alt={product.name} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <ProductBadges badges={product.badges} className="absolute left-2 top-2 hidden sm:flex" />
      </Link>
      <WishlistButton product={product} className="absolute right-2 top-2 z-10 size-8 sm:right-3 sm:top-3 sm:size-10" />

      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
          {product.category?.name}
        </span>
        <Link to={`/product/${product.slug}`} className="mt-1 line-clamp-2 pr-9 font-display text-base font-bold transition-colors hover:text-brand-fg sm:pr-12 sm:text-xl">{product.name}</Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-fg-subtle">
          <Rating value={product.rating} count={product.reviewCount} />
          <span>·</span>
          <span>{product.soldCount}+ sold</span>
        </div>
        <p className="mt-3 hidden text-sm text-fg-muted line-clamp-2 sm:block">{product.description} Quality checked and shipped from Pune within 24 hours.</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted sm:mt-3">
          <span className="inline-flex items-center gap-1"><Truck className="size-3.5 text-brand-fg" />Delivery in 2–5 days</span>
          <span className={cn('inline-flex items-center gap-1', product.inStock ? 'text-success-fg' : 'text-danger-fg')}>
            <Check className="size-3.5" />{product.inStock ? (product.stock <= 10 ? `Only ${product.stock} left` : 'In stock') : 'Sold out'}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3 sm:gap-3 sm:pt-4">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          <div className="flex gap-2">
            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setQuickView(true)} className="hidden h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium transition-colors hover:border-brand-500 hover:text-brand-fg sm:inline-flex">
              <Eye className="size-4" /> Quick view
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              disabled={!product.inStock}
              onClick={() => {
                flyToCart(imageRef.current)
                cart.add(product)
              }}
              className="relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-xl bg-gradient-brand px-3 text-sm sm:h-10 sm:px-5 font-semibold text-white shadow-glow-sm shine-on-hover hover:brightness-110 disabled:opacity-50"
            >
              <ShoppingBag className="size-4" /> <span className="hidden sm:inline">Add to cart</span><span className="sm:hidden">Add</span>
            </motion.button>
          </div>
        </div>
      </div>
      <QuickView product={product} open={quickView} onClose={() => setQuickView(false)} />
    </motion.article>
  )
}

export function ProductListItemSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="skeleton h-40 w-28 shrink-0 rounded-none sm:h-56 sm:w-64" />
      <div className="flex-1 space-y-3 p-5">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-6 w-2/3" />
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  )
}
