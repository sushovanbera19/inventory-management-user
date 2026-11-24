// FAQ: searchable accordion of common questions.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { Button, SearchInput } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/cn'

const FAQS = [
  ['Orders', 'How do I track my order?', 'Go to Track order in the menu and enter your order number and email, or open the order from My account.'],
  ['Orders', 'Can I change or cancel my order?', 'Yes, until it ships. Contact us with your order number and we will update or cancel it.'],
  ['Delivery', 'How long does delivery take?', 'Orders ship within 24 hours and arrive in 2–5 working days across India.'],
  ['Delivery', 'Is delivery free?', 'Delivery is free on orders over ₹1,999. Smaller orders have a flat ₹99 fee.'],
  ['Payments', 'Which payment methods do you accept?', 'UPI, credit and debit cards, bank transfer and cash on delivery.'],
  ['Payments', 'Do you give GST invoices?', 'Yes, every order comes with a GST invoice. Add your company details in the order notes.'],
  ['Returns', 'What is your return policy?', 'Return any unused item in its original packaging within 7 days of delivery for a full refund.'],
  ['Returns', 'When will I get my refund?', 'Refunds are processed within 3 working days after we receive the return.'],
  ['Account', 'Do I need an account to order?', 'You need a free account to check out, so you can track orders and reorder in one click.'],
]

export default function FaqPage() {
  usePageTitle('FAQ')
  const [open, setOpen] = useState(0)
  const [search, setSearch] = useState('')
  const items = FAQS.filter(([, question, answer]) => `${question} ${answer}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-center font-display text-4xl font-bold tracking-tight">Frequently asked questions</h1>
      <p className="mt-2 text-center text-fg-muted">Quick answers about orders, delivery, payments and returns.</p>
      <SearchInput value={search} onChange={setSearch} debounce={0} placeholder="Search questions…" className="mx-auto mt-8 max-w-md" />
      <ul className="mt-8 space-y-3">
        {items.map(([topic, question, answer], index) => (
          <li key={question} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <button type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)} className="flex w-full items-center gap-3 p-5 text-left">
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-fg">{topic}</span>
              <span className="flex-1 font-semibold">{question}</span>
              <ChevronDown className={cn('size-5 shrink-0 text-fg-subtle transition-transform duration-300', open === index && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {open === index && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                  <p className="px-5 pb-5 text-fg-muted">{answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
      <div className="mt-12 rounded-3xl bg-gradient-brand p-8 text-center text-white">
        <p className="text-lg font-semibold">Still have a question?</p>
        <p className="mt-1 text-white/80">Our team replies within one working day.</p>
        <Button variant="secondary" className="mt-5" to="/contact">Contact us</Button>
      </div>
    </div>
  )
}
