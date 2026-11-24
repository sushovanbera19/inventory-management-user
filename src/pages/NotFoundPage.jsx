// 404 page.
import { motion } from 'motion/react'
import { PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4 py-16 text-center">
      <div>
        <motion.div animate={{ y: [0, -12, 0], rotate: [-4, 4, -4] }} transition={{ duration: 5, repeat: Infinity }} className="mx-auto grid size-24 place-items-center rounded-3xl bg-brand-soft text-brand-fg shadow-glow">
          <PackageOpen className="size-12" strokeWidth={1.5} />
        </motion.div>
        <p className="mt-6 font-display text-7xl font-extrabold text-gradient-brand">404</p>
        <h1 className="mt-2 text-2xl font-bold">We couldn't find that page</h1>
        <p className="mt-2 text-fg-muted">It may have moved, or the link is wrong.</p>
        <div className="mt-8 flex justify-center gap-3"><Button variant="secondary" to="/">Home</Button><Button to="/shop">Go shopping</Button></div>
      </div>
    </div>
  )
}
