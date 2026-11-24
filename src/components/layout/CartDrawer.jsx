// Slide-in cart: lines with quantity controls, free-shipping progress, subtotal and checkout.
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ShoppingBag, Trash2, Truck } from 'lucide-react'
import { Button, Drawer, ProgressBar, QuantityStepper } from '@/components/ui'
import { FREE_SHIPPING_FROM } from '@/config/app'
import { useCart } from '@/context/StoreContexts'
import { formatCurrency } from '@/lib/format'

export function FreeShippingMeter({ subtotal }) {
  const left = Math.max(0, FREE_SHIPPING_FROM - subtotal)
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className="mb-2 flex items-center gap-2 text-sm">
        <Truck className="size-4 text-brand-fg" />
        {left > 0 ? <>Add <b className="tabular-nums">{formatCurrency(left)}</b> more for free delivery</> : <b className="text-success-fg">You've unlocked free delivery 🎉</b>}
      </p>
      <ProgressBar size="sm" value={Math.min(subtotal, FREE_SHIPPING_FROM)} max={FREE_SHIPPING_FROM} tone={left > 0 ? 'brand' : 'success'} />
    </div>
  )
}

export function CartDrawer() {
  const cart = useCart()
  const navigate = useNavigate()

  return (
    <Drawer
      open={cart.isOpen}
      onClose={cart.close}
      size="md"
      title={`Your cart (${cart.count})`}
      footer={
        cart.items.length > 0 && (
          <div className="w-full space-y-3">
            <div className="flex justify-between text-base font-semibold"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(cart.subtotal)}</span></div>
            <p className="text-xs text-fg-subtle">Taxes and delivery are calculated at checkout.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => { cart.close(); navigate('/cart') }}>View cart</Button>
              <Button onClick={() => { cart.close(); navigate('/checkout') }}>Checkout</Button>
            </div>
          </div>
        )
      }
    >
      {cart.items.length === 0 ? (
        <div className="grid h-full place-items-center text-center">
          <div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="mx-auto grid size-20 place-items-center rounded-3xl bg-brand-soft text-brand-fg">
              <ShoppingBag className="size-9" />
            </motion.div>
            <p className="mt-4 text-lg font-semibold">Your cart is empty</p>
            <p className="mt-1 text-sm text-fg-muted">Find something you love.</p>
            <Button className="mt-5" onClick={() => { cart.close(); navigate('/shop') }}>Start shopping</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <FreeShippingMeter subtotal={cart.subtotal} />
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {cart.items.map((item) => (
                <motion.li key={item.productId} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex gap-3 rounded-xl border border-line p-3">
                  <Link to={`/product/${item.slug}`} onClick={cart.close}>
                    <img src={item.imageUrl} alt={item.name} className="size-20 rounded-lg object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link to={`/product/${item.slug}`} onClick={cart.close} className="line-clamp-2 text-sm font-semibold hover:text-brand-fg">{item.name}</Link>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QuantityStepper size="sm" value={item.quantity} min={1} max={item.stock} onChange={(quantity) => cart.update(item.productId, quantity)} aria-label="Quantity" />
                      <button type="button" aria-label="Remove" onClick={() => cart.remove(item.productId)} className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-danger-soft hover:text-danger-fg"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </Drawer>
  )
}
