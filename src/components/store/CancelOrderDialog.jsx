// "Cancel order" dialog: pick a reason, see what happens to the payment, confirm.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Ban, Check, CircleDollarSign, PackageX } from 'lucide-react'
import { Button, Modal, Textarea } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import { useCancelOrder } from '@/queries'

const REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery is taking too long',
  'Want to change items or quantity',
  'Need to change the delivery address',
  'Other reason',
]

export function CancelOrderDialog({ order, open, onClose, onCancelled }) {
  return (
    <Modal open={open} onClose={onClose} size="md" title="Cancel this order?" description={order ? `Order ${order.orderNumber} · ${order.itemsCount} items` : undefined} icon={<PackageX />}>
      {open && order && <CancelForm order={order} onClose={onClose} onCancelled={onCancelled} />}
    </Modal>
  )
}

function CancelForm({ order, onClose, onCancelled }) {
  const toast = useToast()
  const cancel = useCancelOrder()
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const paid = order.paymentStatus === 'paid'

  async function confirm() {
    if (!reason) {
      setError('Please choose a reason.')
      return
    }
    if (reason === 'Other reason' && !note.trim()) {
      setError('Tell us a little more about the reason.')
      return
    }
    try {
      const updated = await cancel.mutateAsync({ orderNumber: order.orderNumber, reason, note })
      toast.success('Order cancelled', { description: paid ? `Your refund of ${formatCurrency(order.total)} has started.` : `${order.orderNumber} has been cancelled.` })
      onCancelled?.(updated)
      onClose()
    } catch (err) {
      toast.error('Could not cancel the order', { description: err.message })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex -space-x-3">
        {order.items.slice(0, 5).map((item) => (
          <img key={item.id} src={item.imageUrl} alt={item.name} title={item.name} className="size-12 rounded-xl border-2 border-surface object-cover shadow-card" />
        ))}
        {order.items.length > 5 && <span className="grid size-12 place-items-center rounded-xl border-2 border-surface bg-surface-3 text-xs font-semibold">+{order.items.length - 5}</span>}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-fg">Why are you cancelling?</legend>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
          {REASONS.map((item, index) => {
            const active = reason === item
            return (
              <motion.button
                key={item}
                type="button"
                role="radio"
                aria-checked={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setReason(item)
                  setError('')
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all',
                  active ? 'border-danger bg-danger-soft/60 font-medium text-fg' : 'border-line text-fg-muted hover:border-line-strong hover:text-fg',
                )}
              >
                <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors', active ? 'border-danger bg-danger text-white' : 'border-line-strong')}>
                  {active && <Check className="size-3" strokeWidth={3} />}
                </span>
                {item}
              </motion.button>
            )
          })}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {reason && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Textarea
              label={reason === 'Other reason' ? 'Tell us more' : 'Anything else?'}
              optional={reason !== 'Other reason'}
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Your feedback helps us improve."
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-3 rounded-xl bg-surface-2 p-3.5 text-sm">
        <CircleDollarSign className="mt-0.5 size-5 shrink-0 text-brand-fg" />
        <p className="text-fg-muted">
          {paid ? (
            <>You paid <b className="text-fg">{formatCurrency(order.total)}</b>. It will be refunded to your original payment method within 3–5 working days.</>
          ) : (
            <>Nothing has been charged for this order, so there is nothing to refund.</>
          )}
        </p>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-danger-fg">{error}</p>}

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Keep my order</Button>
        <Button variant="danger" leftIcon={<Ban />} loading={cancel.isPending} onClick={confirm}>Cancel order</Button>
      </div>
    </div>
  )
}
