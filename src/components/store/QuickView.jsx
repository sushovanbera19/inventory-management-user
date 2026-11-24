// Quick view: the product's key details and "add to cart" in a dialog, without leaving the page.
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Check, ShoppingBag, Truck } from 'lucide-react'
import { Badge, Button, Modal, QuantityStepper } from '@/components/ui'
import { useCart } from '@/context/StoreContexts'
import { flyToCart } from '@/lib/flyToCart'
import { formatCurrency } from '@/lib/format'

export function QuickView({ product, open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} size="xl" bodyClassName="p-0 sm:p-0" hideCloseButton={false}>
      {open && <QuickViewBody product={product} onClose={onClose} />}
    </Modal>
  )
}

function QuickViewBody({ product, onClose }) {
  const cart = useCart()
  const imageRef = useRef(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const off = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0

  return (
    <div className="grid gap-6 pb-6 md:grid-cols-2 md:pb-0">
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="overflow-hidden rounded-2xl bg-surface-2">
        <img ref={imageRef} src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col py-2 md:pr-2">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-fg">{product.category?.name}</p>
        <h2 className="mt-2 font-display text-2xl font-bold">{product.name}</h2>
        <p className="mt-1 text-sm text-fg-subtle">★ {product.rating} · {product.reviewCount} reviews · {product.soldCount}+ sold</p>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="font-display text-3xl font-bold">{formatCurrency(product.price)}</span>
          {product.compareAtPrice && <span className="text-fg-subtle line-through">{formatCurrency(product.compareAtPrice)}</span>}
          {off > 0 && <Badge tone="success" size="sm">{off}% off</Badge>}
        </div>
        <p className="mt-4 text-sm text-fg-muted">{product.description}</p>
        <p className="mt-4 flex items-center gap-2 text-sm"><Truck className="size-4 text-brand-fg" />Delivery in 2–5 days</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <QuantityStepper value={quantity} min={1} max={Math.max(product.stock, 1)} onChange={setQuantity} disabled={!product.inStock} aria-label="Quantity" />
          <Button
            className="flex-1"
            size="lg"
            disabled={!product.inStock}
            variant={added ? 'success' : 'primary'}
            leftIcon={added ? <Check /> : <ShoppingBag />}
            onClick={() => {
              flyToCart(imageRef.current)
              cart.add(product, quantity)
              setAdded(true)
              setTimeout(onClose, 700)
            }}
          >
            {added ? 'Added!' : product.inStock ? 'Add to cart' : 'Sold out'}
          </Button>
        </div>
        <Link to={`/product/${product.slug}`} onClick={onClose} className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-fg">
          View full details <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </div>
  )
}
