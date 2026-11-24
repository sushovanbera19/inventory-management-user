// Order status tracker and item list, shared by "Track order" and the account's order page.
import { Link } from 'react-router'
import { Badge, Stepper, Timeline } from '@/components/ui'
import { ORDER_STATUS, ORDER_STATUS_FLOW, PAYMENT_METHODS } from '@/lib/constants'
import { formatCurrency, formatDateTime } from '@/lib/format'

export function OrderTracker({ order }) {
  const cancelled = order.status === 'cancelled'
  const reached = [...order.timeline].reverse().find((event) => ORDER_STATUS_FLOW.includes(event.status))?.status ?? 'pending'
  const current = cancelled ? ORDER_STATUS_FLOW.indexOf(reached) + 1 : ORDER_STATUS_FLOW.indexOf(order.status)
  const address = order.shippingAddress

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-fg-subtle">Order</p>
            <p className="font-mono text-xl font-bold">{order.orderNumber}</p>
          </div>
          <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
        </div>
        <Stepper steps={ORDER_STATUS_FLOW.map((status) => ({ key: status, label: ORDER_STATUS[status].label }))} current={current} allComplete={order.status === 'delivered'} cancelled={cancelled} />
        {order.carrier && <p className="mt-6 rounded-xl bg-surface-2 p-3 text-sm">Shipped with <b>{order.carrier}</b>{order.trackingNumber && <> · tracking <span className="font-mono">{order.trackingNumber}</span></>}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-line bg-surface shadow-card">
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-4">
                {item.imageUrl && <img src={item.imageUrl} alt="" className="size-14 rounded-xl object-cover" />}
                <span className="min-w-0 flex-1">
                  <Link to={`/product/${item.slug}`} className="block truncate font-medium hover:text-brand-fg">{item.name}</Link>
                  <span className="text-xs text-fg-subtle">{formatCurrency(item.unitPrice)} × {item.quantity}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-line p-4 text-sm">
            <div className="flex justify-between"><dt className="text-fg-muted">Subtotal</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
            {order.discountAmount > 0 && <div className="flex justify-between text-success-fg"><dt>Discount</dt><dd>− {formatCurrency(order.discountAmount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-fg-muted">GST</dt><dd>{formatCurrency(order.taxAmount)}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-muted">Delivery</dt><dd>{order.shippingFee ? formatCurrency(order.shippingFee) : 'Free'}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd>{formatCurrency(order.total)}</dd></div>
          </dl>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-5 text-sm shadow-card">
            <p className="mb-1 font-semibold">Delivery address</p>
            <p className="text-fg-muted">{address?.name}<br />{address?.line1}{address?.line2 ? `, ${address.line2}` : ''}<br />{address?.city} {address?.postalCode}</p>
            <p className="mb-1 mt-4 font-semibold">Payment</p>
            <p className="text-fg-muted">{PAYMENT_METHODS[order.paymentMethod]?.label} · {order.paymentStatus}</p>
          </div>
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <p className="mb-4 font-semibold">History</p>
            <Timeline items={[...order.timeline].reverse().filter((event) => event.type !== 'note').map((event) => ({ id: event.id, title: event.title, time: formatDateTime(event.at), tone: event.status === 'cancelled' ? 'danger' : event.type === 'payment' ? 'success' : 'brand' }))} />
          </div>
        </div>
      </div>
    </div>
  )
}
