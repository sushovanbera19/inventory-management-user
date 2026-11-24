// One of my orders: live status tracker, items, totals, address and history, plus "buy again" and "cancel order".
import { useState } from 'react'
import { useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Ban, Info, PackageSearch, RotateCcw } from 'lucide-react'
import { CancelOrderDialog } from '@/components/store/CancelOrderDialog'
import { CAN_CANCEL } from '@/lib/orderRules'
import { OrderTracker } from '@/components/store/OrderTracker'
import { Button, EmptyState } from '@/components/ui'
import { useCart } from '@/context/StoreContexts'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useMyOrder } from '@/queries'

export default function OrderPage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading, error } = useMyOrder(orderNumber)
  const cart = useCart()
  const [cancelling, setCancelling] = useState(false)
  usePageTitle(`Order ${orderNumber}`)

  const canCancel = order && CAN_CANCEL.includes(order.status)
  const cancelledEvent = order?.timeline.findLast?.((event) => event.status === 'cancelled')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" to="/account?tab=orders" leftIcon={<ArrowLeft />}>My orders</Button>
        {order && (
          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <Button variant="danger-soft" leftIcon={<Ban />} onClick={() => setCancelling(true)}>Cancel order</Button>
            )}
            <Button variant="secondary" leftIcon={<RotateCcw />} onClick={() => order.items.forEach((item, index) => cart.add({ id: item.productId, slug: item.slug, name: item.name, sku: item.sku, price: item.unitPrice, imageUrl: item.imageUrl, stock: 99, unit: item.unit }, item.quantity, { silent: index > 0 }))}>
              Buy again
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {order?.status === 'cancelled' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm">
            <Ban className="mt-0.5 size-5 shrink-0 text-danger-fg" />
            <div>
              <p className="font-semibold text-danger-fg">This order was cancelled</p>
              {cancelledEvent?.note && <p className="mt-0.5 text-fg-muted">Reason: {cancelledEvent.note}</p>}
              {order.paymentStatus === 'refunded' && <p className="mt-0.5 text-fg-muted">Your refund is on its way (3–5 working days).</p>}
            </div>
          </motion.div>
        )}
        {order && ['shipped', 'delivered'].includes(order.status) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-sm text-fg-muted">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-fg" />
            {order.status === 'shipped' ? 'This order has shipped, so it can no longer be cancelled. You can return it within 7 days of delivery.' : 'Need to send something back? Items can be returned within 7 days of delivery — contact us to start a return.'}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && <div className="skeleton h-96 rounded-3xl" />}
      {error && <EmptyState icon={<PackageSearch />} title="Order not found" action={<Button to="/account?tab=orders">Back to my orders</Button>} />}
      {order && <OrderTracker order={order} />}

      <CancelOrderDialog order={order} open={cancelling} onClose={() => setCancelling(false)} />
    </div>
  )
}
