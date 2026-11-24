// Footer: newsletter signup, link columns, support details and trust badges.
import { useState } from 'react'
import { Link } from 'react-router'
import { CreditCard, Mail, MapPin, Phone, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { Button } from '@/components/ui'
import { APP_NAME, SUPPORT } from '@/config/app'
import { useToast } from '@/context/ToastContext'
import { useCategories, useSubscribe } from '@/queries'

const YEAR = new Date().getFullYear()

export function StoreFooter() {
  const { data: categories } = useCategories()
  const subscribe = useSubscribe()
  const toast = useToast()
  const [email, setEmail] = useState('')

  async function submit(event) {
    event.preventDefault()
    try {
      await subscribe.mutateAsync({ email })
      setEmail('')
      toast.success('You are subscribed!', { description: 'Watch your inbox for deals and new arrivals.' })
    } catch (error) {
      toast.error('Could not subscribe', { description: error.message })
    }
  }

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            [Truck, 'Fast delivery', 'Across India in 2–5 days'],
            [RotateCcw, 'Easy returns', '7 days, no questions asked'],
            [ShieldCheck, 'Secure payments', 'UPI, cards and COD'],
            [CreditCard, 'GST invoices', 'For every business order'],
          ].map(([Icon, title, text]) => (
            <div key={title} className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-fg"><Icon className="size-5" /></span>
              <span><span className="block font-semibold">{title}</span><span className="block text-sm text-fg-muted">{text}</span></span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-2.5"><LogoMark size={34} /><span className="font-display text-lg font-bold">{APP_NAME}</span></Link>
          <p className="mt-3 max-w-sm text-sm text-fg-muted">Quality products for work and home, from trusted Indian suppliers, delivered fast.</p>
          <form onSubmit={submit} className="mt-5 flex max-w-sm gap-2">
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email" aria-label="Email for newsletter" className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 md:text-sm" />
            <Button type="submit" loading={subscribe.isPending}>Subscribe</Button>
          </form>
        </div>
        <FooterColumn title="Shop" links={[['/shop', 'All products'], ['/shop?sort=newest', 'New arrivals'], ['/shop?onSale=true', 'Deals'], ...(categories ?? []).slice(0, 4).map((category) => [`/category/${category.slug}`, category.name])]} />
        <FooterColumn title="Help" links={[['/track-order', 'Track your order'], ['/faq', 'FAQ'], ['/contact', 'Contact us'], ['/account', 'My account'], ['/wishlist', 'Wishlist']]} />
        <div>
          <p className="mb-3 text-sm font-semibold">Get in touch</p>
          <ul className="space-y-2.5 text-sm text-fg-muted">
            <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" />{SUPPORT.phone}</li>
            <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0" /><span className="break-all">{SUPPORT.email}</span></li>
            <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{SUPPORT.address}</li>
          </ul>
          <p className="mt-3 text-xs text-fg-subtle">{SUPPORT.hours}</p>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-fg-subtle">
        © {YEAR} {APP_NAME}. All rights reserved. · <Link to="/about" className="hover:text-fg">About us</Link>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <ul className="space-y-2 text-sm">
        {links.map(([to, label]) => (
          <li key={to}><Link to={to} className="text-fg-muted transition-colors hover:text-brand-fg">{label}</Link></li>
        ))}
      </ul>
    </div>
  )
}
