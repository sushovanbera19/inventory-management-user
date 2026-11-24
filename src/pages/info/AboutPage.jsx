// About us: story, numbers and values.
import { motion } from 'motion/react'
import { HeartHandshake, Leaf, ShieldCheck, Truck } from 'lucide-react'
import { Button, Reveal, Stagger, StaggerItem } from '@/components/ui'
import { APP_NAME } from '@/config/app'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function AboutPage() {
  usePageTitle('About us')
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-fg">Our story</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Making everyday buying <span className="text-gradient-brand">simple</span></h1>
        <p className="mt-5 text-lg text-fg-muted">{APP_NAME} started in Pune with one idea: homes and small businesses deserve the same quality, prices and service that big companies get. Today we work with trusted suppliers across India to deliver thousands of products, fast.</p>
      </motion.div>
      <Stagger className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['10k+', 'Customers served'], ['50+', 'Product lines'], ['9', 'Trusted suppliers'], ['4.8★', 'Average rating']].map(([value, label]) => (
          <StaggerItem key={label} className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
            <p className="font-display text-3xl font-bold text-gradient-brand">{value}</p>
            <p className="mt-1 text-sm text-fg-muted">{label}</p>
          </StaggerItem>
        ))}
      </Stagger>
      <Reveal className="mt-16 grid gap-6 md:grid-cols-2">
        {[
          [ShieldCheck, 'Quality checked', 'Every product is inspected before it leaves our warehouse.'],
          [Truck, 'Fast, reliable delivery', 'We ship within 24 hours with tracking on every parcel.'],
          [HeartHandshake, 'People who care', 'Real humans answer the phone, six days a week.'],
          [Leaf, 'Better packaging', 'Recyclable materials and less plastic in every box.'],
        ].map(([Icon, title, text]) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-fg"><Icon className="size-6" /></span>
            <span><span className="block text-lg font-semibold">{title}</span><span className="mt-1 block text-fg-muted">{text}</span></span>
          </div>
        ))}
      </Reveal>
      <div className="mt-16 text-center"><Button size="lg" to="/shop">Explore the shop</Button></div>
    </div>
  )
}
