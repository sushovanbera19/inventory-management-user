// Track an order with its number and the email used, no sign-in needed.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PackageSearch } from 'lucide-react'
import { OrderTracker } from '@/components/store/OrderTracker'
import { Button, Input } from '@/components/ui'
import { DEMO_CREDENTIALS } from '@/config/app'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useTrackOrder } from '@/queries'

export default function TrackOrderPage() {
  usePageTitle('Track your order')
  const track = useTrackOrder()
  const [form, setForm] = useState({ orderNumber: '', email: '' })

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand-fg"><PackageSearch className="size-8" /></span>
        <h1 className="mt-4 font-display text-3xl font-bold">Track your order</h1>
        <p className="mt-2 text-fg-muted">Enter your order number and the email you ordered with.</p>
        <form className="mt-8 grid gap-3 text-left sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(event) => { event.preventDefault(); track.mutate(form) }}>
          <Input label="Order number" placeholder="SO-10338" className="font-mono" value={form.orderNumber} onChange={(event) => setForm((current) => ({ ...current, orderNumber: event.target.value }))} required />
          <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          <Button type="submit" loading={track.isPending}>Track</Button>
        </form>
        <p className="mt-3 text-xs text-fg-subtle">Demo: sign in as {DEMO_CREDENTIALS.email} to see real order numbers in My account.</p>
      </div>
      <AnimatePresence mode="wait">
        {track.isError && <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center text-danger-fg">We couldn't find an order with those details. Check the number and email.</motion.p>}
        {track.data && <motion.div key={track.data.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10"><OrderTracker order={track.data} /></motion.div>}
      </AnimatePresence>
    </div>
  )
}
