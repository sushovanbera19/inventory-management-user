// Home: hero slider, marquees, bento categories, deals carousel with countdown, business banner with
// count-up stats, bestsellers slider, promo tiles, new arrivals, review marquee and newsletter.
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, ArrowUpRight, BadgeCheck, Building2, Clock, Flame, Mail, Quote, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { Carousel, CountUp, Marquee, Spotlight, TiltCard } from '@/components/effects/Effects'
import { HeroSlider } from '@/components/store/HeroSlider'
import { ProductCard, ProductCardSkeleton, Rating, SectionHeading, SeeAllLink } from '@/components/store/ProductBits'
import { Button, Stagger } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PRODUCT_IMAGES } from '@/api/mock/productPhotos'
import { cn } from '@/lib/cn'
import { categoryHex } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import { useCategories, useProducts, useSubscribe } from '@/queries'

const REVIEWS = [
  ['Kavya Iyer', 'Chennai', 'The ergonomic chair arrived in two days and assembly took ten minutes. Best purchase for my home office.'],
  ['Rahul Verma', 'Pune', 'We buy all our office supplies here. GST invoices, fast delivery, and the team actually picks up the phone.'],
  ['Divya Choudhary', 'Indore', 'Ordered packaging for our cafes in bulk. Great prices and every box arrived exactly as described.'],
  ['Arjun Nambiar', 'Kochi', 'The mechanical keyboard feels premium. Packaging was beautiful too — felt like a gift.'],
  ['Pooja Agarwal', 'Jaipur', 'Return was super easy when I ordered the wrong size. Refund came in two days.'],
  ['Manish Tiwari', 'Lucknow', 'Dumbbells and mats for the whole studio. Solid quality and quick delivery.'],
]

export default function HomePage() {
  usePageTitle()
  return (
    <div className="overflow-x-clip">
      <HeroSlider />
      <BenefitsMarquee />
      <CategoryBento />
      <DealsSection />
      <BusinessBanner />
      <ProductSlider eyebrow="Customer favourites" title="Bestsellers everyone loves" params={{ sort: 'bestselling', pageSize: 10 }} to="/shop?sort=bestselling" />
      <PromoTiles />
      <NewArrivals />
      <ReviewsMarquee />
      <Newsletter />
    </div>
  )
}

/* ---------------------------------------------------------------------------------------------- */

function BenefitsMarquee() {
  const items = [[Truck, 'Free delivery over ₹1,999'], [RotateCcw, '7-day easy returns'], [ShieldCheck, 'Secure payments'], [BadgeCheck, 'GST invoices'], [Sparkles, 'Use WELCOME10 for 10% off'], [Building2, 'Bulk prices for business']]
  return (
    <div className="border-b border-line bg-surface py-4">
      <Marquee duration={35}>
        {items.map(([Icon, label]) => (
          <span key={label} className="mx-8 inline-flex items-center gap-3 whitespace-nowrap text-sm font-semibold text-fg-muted">
            <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand-fg"><Icon className="size-4" /></span>
            {label}
            <span className="ml-8 text-brand-500">✦</span>
          </span>
        ))}
      </Marquee>
    </div>
  )
}

function CategoryBento() {
  const { data: categories } = useCategories()
  const list = categories ?? []
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Explore" title="Shop by category" description="Eight departments, hundreds of reasons to smile." action={<SeeAllLink to="/shop">All products</SeeAllLink>} />
      <Stagger stagger={0.06} className="grid auto-rows-[220px] grid-cols-2 gap-4 md:grid-cols-4">
        {(list.length ? list : Array.from({ length: 8 }, (_, index) => ({ slug: index }))).map((category, index) => {
          const big = index === 0 || index === 5
          if (!category.name) return <div key={category.slug} className={cn('skeleton rounded-3xl', big && 'md:col-span-2 md:row-span-2')} />
          const color = categoryHex(category.color)
          return (
            <motion.div key={category.slug} variants={{ hidden: { opacity: 0, y: 30, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }} className={cn(big && 'md:col-span-2 md:row-span-2')}>
              <Spotlight className="h-full rounded-3xl" color={`color-mix(in oklab, ${color} 30%, transparent)`}>
                <Link to={`/category/${category.slug}`} className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-line p-5 shadow-card transition-shadow duration-500 hover:shadow-raised" style={{ background: `linear-gradient(145deg, color-mix(in oklab, ${color} 18%, var(--surface)), var(--surface))` }}>
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className={cn('font-display font-bold text-fg', big ? 'text-2xl sm:text-3xl' : 'text-lg')}>{category.name}</p>
                      <p className="mt-1 text-sm text-fg-muted">{category.productCount} products · from {formatCurrency(category.startingPrice)}</p>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-fg shadow-card transition-all duration-500 group-hover:rotate-45 group-hover:bg-fg group-hover:text-bg"><ArrowUpRight className="size-5" /></span>
                  </div>
                  <img src={category.imageUrl} alt="" className={cn('absolute rounded-3xl object-cover shadow-2xl transition-all duration-700 ease-out group-hover:-rotate-6 group-hover:scale-110', big ? '-bottom-6 -right-6 w-[62%]' : '-bottom-5 -right-5 w-[55%]')} />
                </Link>
              </Spotlight>
            </motion.div>
          )
        })}
      </Stagger>
    </section>
  )
}

function useCountdown() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const left = Math.max(0, end.getTime() - now)
  return [['Hours', Math.floor(left / 3600000)], ['Mins', Math.floor(left / 60000) % 60], ['Secs', Math.floor(left / 1000) % 60]]
}

function DealsSection() {
  const parts = useCountdown()
  const { data, isLoading } = useProducts({ onSale: true, sort: 'bestselling', pageSize: 10 })
  return (
    <section className="relative mt-24 overflow-hidden py-20">
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-rose-500/10 via-fuchsia-500/5 to-amber-400/10" />
      <div aria-hidden="true" className="absolute -left-32 top-10 size-96 rounded-full bg-rose-500/20 blur-[100px] animate-blob" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading className="mb-0" eyebrow="Limited time" title={<span className="inline-flex items-center gap-3">Today's hot deals <Flame className="size-9 text-rose-500" /></span>} description="Big discounts on favourites — the timer is ticking." />
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-rose-500" />
            {parts.map(([label, value]) => (
              <div key={label} className="text-center">
                <motion.div key={value} initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.35 }} className="grid size-14 place-items-center rounded-2xl bg-fg font-mono text-2xl font-bold text-bg shadow-raised">
                  {String(value).padStart(2, '0')}
                </motion.div>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <Carousel label="Deals">{isLoading ? Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />) : data.data.map((product) => <ProductCard key={product.id} product={product} />)}</Carousel>
      </div>
    </section>
  )
}

function BusinessBanner() {
  const { scrollYProgress } = useScroll()
  const rotate = useTransform(scrollYProgress, [0, 1], [-10, 30])
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
      <div className="border-animated relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12 lg:p-16">
        <motion.div aria-hidden="true" style={{ rotate }} className="absolute -right-24 -top-24 size-[28rem] rounded-full bg-linear-to-br from-brand-500/30 to-fuchsia-500/20 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-fg"><Building2 className="size-3.5" /> For businesses</p>
            <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Stock your office, <span className="text-gradient-brand">save more.</span></h2>
            <p className="mt-4 max-w-md text-lg text-fg-muted">Bulk prices, GST invoices and a dedicated account manager for teams of every size.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" to="/contact" rightIcon={<ArrowRight />}>Talk to sales</Button>
              <Button size="lg" variant="secondary" to="/category/office-supplies">Office supplies</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[[10000, '+', 'Happy customers'], [4.8, '★', 'Average rating', 1], [56, '+', 'Product lines'], [48, 'h', 'Average dispatch']].map(([to, suffix, label, decimals]) => (
              <TiltCard key={label} max={10} className="rounded-3xl">
                <div className="rounded-3xl border border-line bg-surface-2/70 p-6 backdrop-blur">
                  <CountUp to={to} suffix={suffix} decimals={decimals ?? 0} className="font-display text-4xl font-extrabold text-gradient-brand" />
                  <p className="mt-1 text-sm text-fg-muted">{label}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProductSlider({ eyebrow, title, params, to }) {
  const { data, isLoading } = useProducts(params)
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
      <SectionHeading eyebrow={eyebrow} title={title} action={<SeeAllLink to={to} />} />
      <Carousel label={title}>{isLoading ? Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />) : data.data.map((product) => <ProductCard key={product.id} product={product} />)}</Carousel>
    </section>
  )
}

function PromoTiles() {
  const tiles = [
    { title: 'Pack & ship like a pro', text: 'Boxes, tapes and labels in bulk.', to: '/category/packaging', bg: 'from-sky-500 to-indigo-600', img: PRODUCT_IMAGES[0] },
    { title: 'Self-care essentials', text: 'Grooming and skincare favourites.', to: '/category/personal-care', bg: 'from-pink-500 to-rose-600', img: PRODUCT_IMAGES[1] },
    { title: 'Tools for every job', text: 'Drills, sets and work lights.', to: '/category/tools-and-hardware', bg: 'from-teal-500 to-emerald-600', img: PRODUCT_IMAGES[0] },
  ]
  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 pt-24 sm:px-6 md:grid-cols-3 lg:px-8">
      {tiles.map((tile, index) => (
        <motion.div key={tile.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <TiltCard max={8} className="rounded-[2rem]">
            <Link to={tile.to} className={cn('group relative flex h-72 flex-col overflow-hidden rounded-[2rem] bg-linear-to-br p-7 text-white shadow-raised', tile.bg)}>
              <span className="absolute -right-10 -top-10 size-40 rounded-full bg-white/20 blur-2xl transition-transform duration-700 group-hover:scale-150" />
              <h3 className="relative max-w-[70%] font-display text-2xl font-bold leading-tight">{tile.title}</h3>
              <p className="relative mt-2 max-w-[60%] text-sm text-white/80">{tile.text}</p>
              <span className="relative mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur transition-all group-hover:bg-white group-hover:text-fg">Shop now <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              <img src={tile.img} alt="" className="absolute -bottom-8 -right-8 w-48 rotate-12 rounded-3xl shadow-2xl transition-all duration-700 group-hover:-rotate-3 group-hover:scale-110" />
            </Link>
          </TiltCard>
        </motion.div>
      ))}
    </section>
  )
}

function NewArrivals() {
  const { data, isLoading } = useProducts({ sort: 'newest', pageSize: 8 })
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Just landed" title="New arrivals" description="Fresh picks added this month." action={<SeeAllLink to="/shop?sort=newest" />} />
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={{ show: { transition: { staggerChildren: 0.07 } } }} className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />) : data.data.map((product) => <ProductCard key={product.id} product={product} />)}
      </motion.div>
    </section>
  )
}

function ReviewCard({ name, city, text }) {
  return (
    <figure className="mx-3 w-[340px] shrink-0 rounded-3xl border border-line bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-raised">
      <div className="flex items-center justify-between"><Rating value={5} /><Quote className="size-6 text-brand-500/30" /></div>
      <blockquote className="mt-4 text-sm leading-relaxed text-fg-muted">“{text}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-white">{name.split(' ').map((part) => part[0]).join('')}</span>
        <span><span className="block text-sm font-semibold">{name}</span><span className="block text-xs text-fg-subtle">{city} · Verified buyer</span></span>
      </figcaption>
    </figure>
  )
}

function ReviewsMarquee() {
  return (
    <section className="pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading align="center" eyebrow="Reviews" title="Loved by 10,000+ customers" /></div>
      <div className="space-y-5">
        <Marquee duration={50}>{REVIEWS.map(([name, city, text]) => <ReviewCard key={name} name={name} city={city} text={text} />)}</Marquee>
        <Marquee duration={60} reverse>{[...REVIEWS].reverse().map(([name, city, text]) => <ReviewCard key={name} name={name} city={city} text={text} />)}</Marquee>
      </div>
    </section>
  )
}

function Newsletter() {
  const subscribe = useSubscribe()
  const toast = useToast()
  const [email, setEmail] = useState('')
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
      <div className="force-dark relative overflow-hidden rounded-[2.5rem] bg-[#0d0b24] px-6 py-16 text-center text-white sm:px-12">
        <div aria-hidden="true" className="absolute -left-20 -top-20 size-80 bg-brand-500/50 blur-3xl animate-blob" />
        <div aria-hidden="true" className="absolute -bottom-24 -right-10 size-96 bg-fuchsia-500/40 blur-3xl animate-blob [animation-delay:-6s]" />
        <div className="relative mx-auto max-w-xl">
          <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring' }} className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/10 backdrop-blur"><Mail className="size-7" /></motion.span>
          <h2 className="mt-6 font-display text-4xl font-extrabold tracking-tight">Get 10% off your first order</h2>
          <p className="mt-3 text-white/70">Join our newsletter for early access to deals and new arrivals. No spam, ever.</p>
          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            onSubmit={async (event) => {
              event.preventDefault()
              try {
                await subscribe.mutateAsync({ email })
                setEmail('')
                toast.success('Welcome aboard!', { description: 'Your code is WELCOME10.' })
              } catch (error) {
                toast.error('Could not subscribe', { description: error.message })
              }
            }}
          >
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-label="Email" className="h-14 min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-6 text-base text-white outline-none backdrop-blur placeholder:text-white/50 focus:border-white/60 focus:ring-4 focus:ring-white/10" />
            <button type="submit" disabled={subscribe.isPending} className="relative h-14 overflow-hidden rounded-full bg-white px-8 font-semibold text-[#0d0b24] shadow-2xl shine-on-hover transition-transform hover:scale-[1.03]">Subscribe</button>
          </form>
        </div>
      </div>
    </section>
  )
}
