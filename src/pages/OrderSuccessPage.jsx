// Thank-you page after checkout, with a little celebration.
import { useParams } from 'react-router'
import { motion } from 'motion/react'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatCurrency } from '@/lib/format'
import { useMyOrder } from '@/queries'

const CONFETTI = Array.from({ length: 24 }, (_, index) => ({ x: ((index * 37) % 100) - 50, delay: (index % 6) * 0.05, color: ['#7063f7', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'][index % 5], rotate: (index * 47) % 360 }))

export default function OrderSuccessPage() {
  const { orderNumber } = useParams()
  const { data: order } = useMyOrder(orderNumber)
  usePageTitle('Order placed')

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden px-4 py-16 text-center">
      {CONFETTI.map((piece, index) => (
        <motion.span key={index} className="absolute left-1/2 top-24 h-3 w-1.5 rounded-sm" style={{ backgroundColor: piece.color }} initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }} animate={{ x: piece.x * 8, y: 300 + (index % 4) * 60, opacity: 0, rotate: piece.rotate }} transition={{ duration: 1.6, delay: piece.delay, ease: 'easeOut' }} />
      ))}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="mx-auto grid size-24 place-items-center rounded-full bg-success-soft text-success-fg">
        <svg viewBox="0 0 24 24" className="size-12" fill="none" aria-hidden="true">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
        </svg>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h1 className="mt-6 font-display text-3xl font-bold">Thank you for your order!</h1>
        <p className="mt-2 text-fg-muted">Order <span className="font-mono font-semibold text-fg">{orderNumber}</span> is confirmed. We'll let you know when it ships.</p>
        {order && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-surface p-5 text-left shadow-card">
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  <img src={item.imageUrl} alt="" className="size-10 rounded-lg object-cover" />
                  <span className="flex-1 truncate">{item.name} × {item.quantity}</span>
                  <span className="tabular-nums">{formatCurrency(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-line pt-3 font-semibold"><span>Total paid</span><span>{formatCurrency(order.total)}</span></div>
          </div>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="secondary" to="/shop">Continue shopping</Button>
          <Button to={`/account/orders/${orderNumber}`} leftIcon={<Package />}>Track this order</Button>
        </div>
      </motion.div>
    </div>
  )
}
