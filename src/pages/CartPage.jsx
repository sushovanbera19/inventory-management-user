// Cart page: lines, coupon, order summary and recently viewed products.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Lock, ShoppingBag, Tag, Trash2 } from 'lucide-react'
import { FreeShippingMeter } from '@/components/layout/CartDrawer'
import { ProductCard, SectionHeading } from '@/components/store/ProductBits'
import { AnimatedNumber, Button, EmptyState, Input, QuantityStepper, Stagger } from '@/components/ui'
import { STORAGE_KEYS } from '@/config/app'
import { useCart } from '@/context/StoreContexts'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatCurrency } from '@/lib/format'
import { readStorage } from '@/lib/storage'
import { useProducts, useQuote } from '@/queries'

export function OrderSummary({ quote, couponCode, onCoupon, children }) {
  const [code, setCode] = useState(couponCode ?? '')
  return (
    <div className="space-y-4 rounded-3xl border border-line bg-surface p-6 shadow-card">
      <h2 className="text-lg font-semibold">Order summary</h2>
      {onCoupon && (
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); onCoupon(code.trim().toUpperCase()) }}>
          <Input size="sm" placeholder="Coupon code" aria-label="Coupon code" value={code} onChange={(event) => setCode(event.target.value)} leftIcon={<Tag className="size-4" />} />
          <Button size="sm" variant="secondary" type="submit">Apply</Button>
        </form>
      )}
      <dl className="space-y-2 text-sm">
        <Row label="Subtotal" value={formatCurrency(quote?.subtotal ?? 0)} />
        {quote?.discountAmount > 0 && <Row label={`Discount (${couponCode})`} value={`− ${formatCurrency(quote.discountAmount)}`} className="text-success-fg" />}
        <Row label="Delivery" value={quote ? (quote.shippingFee ? formatCurrency(quote.shippingFee) : 'Free') : '—'} />
        <Row label="GST (18%)" value={formatCurrency(quote?.taxAmount ?? 0)} />
      </dl>
      <div className="flex items-end justify-between border-t border-line pt-4">
        <span className="font-semibold">Total</span>
        <AnimatedNumber value={quote?.total ?? 0} duration={0.4} format={(value) => formatCurrency(Math.round(value * 100) / 100)} className="font-display text-2xl font-bold" />
      </div>
      {children}
      <p className="flex items-center justify-center gap-1.5 text-xs text-fg-subtle"><Lock className="size-3.5" /> Secure checkout</p>
    </div>
  )
}

function Row({ label, value, className }) {
  return <div className={`flex justify-between ${className ?? ''}`}><dt className="text-fg-muted">{label}</dt><dd className="font-medium tabular-nums">{value}</dd></div>
}

export default function CartPage() {
  usePageTitle('Cart')
  const cart = useCart()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState('')
  const quote = useQuote(cart.items, coupon)
  const [recentSlugs] = useState(() => readStorage(STORAGE_KEYS.recent, []))
  const { data: suggestions } = useProducts({ sort: 'bestselling', pageSize: 8 })
  const recentProducts = (suggestions?.data ?? []).filter((product) => !cart.items.some((item) => item.productId === product.id)).slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Your cart</h1>
      {cart.items.length === 0 ? (
        <EmptyState className="mt-10" icon={<ShoppingBag />} title="Your cart is empty" description="Browse our bestsellers and find something you love." action={<Button to="/shop" rightIcon={<ArrowRight />}>Start shopping</Button>} />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <FreeShippingMeter subtotal={cart.subtotal} />
            <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
              <AnimatePresence initial={false}>
                {cart.items.map((item) => (
                  <motion.li key={item.productId} layout exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-4 p-4 sm:p-5">
                    <Link to={`/product/${item.slug}`}><img src={item.imageUrl} alt={item.name} className="size-24 rounded-xl object-cover" /></Link>
                    <div className="min-w-0 flex-1 basis-48">
                      <Link to={`/product/${item.slug}`} className="font-semibold hover:text-brand-fg">{item.name}</Link>
                      <p className="font-mono text-xs text-fg-subtle">{item.sku}</p>
                      <p className="mt-1 text-sm text-fg-muted">{formatCurrency(item.price)} each</p>
                      <div className="mt-3 flex items-center gap-3">
                        <QuantityStepper size="sm" value={item.quantity} min={1} max={item.stock} onChange={(quantity) => cart.update(item.productId, quantity)} aria-label="Quantity" />
                        <button type="button" onClick={() => cart.remove(item.productId)} className="inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-danger-fg"><Trash2 className="size-4" />Remove</button>
                      </div>
                    </div>
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(item.price * item.quantity)}</p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <Link to="/shop" className="inline-block text-sm font-medium text-brand-fg hover:underline">← Continue shopping</Link>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummary quote={quote.data} couponCode={coupon} onCoupon={setCoupon}>
              {quote.error && <p className="text-sm text-danger-fg">{quote.error.message}</p>}
              <Button size="lg" fullWidth rightIcon={<ArrowRight />} onClick={() => navigate('/checkout', { state: { coupon: quote.error ? '' : coupon } })}>Checkout</Button>
              <p className="text-center text-xs text-fg-subtle">Tip: try the code <b>WELCOME10</b></p>
            </OrderSummary>
          </div>
        </div>
      )}

      {recentProducts.length > 0 && (
        <section className="mt-16">
          <SectionHeading title={recentSlugs.length ? 'You might also like' : 'Popular right now'} />
          <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4">{recentProducts.map((product) => <ProductCard key={product.id} product={product} />)}</Stagger>
        </section>
      )}
    </div>
  )
}
