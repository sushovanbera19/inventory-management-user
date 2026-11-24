// Full-width hero slider: auto-plays, pauses on hover, swipe/drag or arrows to change slides,
// products float and follow the pointer, the headline rises word by word.
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { SplitText } from '@/components/effects/Effects'
import { PRODUCT_IMAGES } from '@/api/mock/productPhotos'
import { cn } from '@/lib/cn'

// Main picture + two smaller ones, alternating the product photos.
const PICTURES = [PRODUCT_IMAGES[0], PRODUCT_IMAGES[1 % PRODUCT_IMAGES.length], PRODUCT_IMAGES[0]]

const SLIDES = [
  {
    eyebrow: 'Tech that works as hard as you',
    title: 'Upgrade your desk setup',
    text: 'Mechanical keyboards, crisp monitors and wireless gear — up to 30% off this week.',
    cta: { label: 'Shop electronics', to: '/category/electronics' },
    price: 'From ₹299',
    bg: 'from-[#0b0b2b] via-[#1b1464] to-[#3a1c71]',
    glow: 'bg-indigo-500',
    images: PICTURES,
  },
  {
    eyebrow: 'Comfort for long days',
    title: 'Furniture made for focus',
    text: 'Ergonomic chairs and height-adjustable desks with free delivery and easy assembly.',
    cta: { label: 'Shop furniture', to: '/category/furniture' },
    price: 'From ₹999',
    bg: 'from-[#1a0b2e] via-[#4a1d6e] to-[#9d2b74]',
    glow: 'bg-fuchsia-500',
    images: PICTURES,
  },
  {
    eyebrow: 'Fresh for the kitchen',
    title: 'Cook, sip, store in style',
    text: 'Kettles, bottles and glass storage that look as good as they work.',
    cta: { label: 'Shop kitchen', to: '/category/kitchen-and-dining' },
    price: 'From ₹449',
    bg: 'from-[#2b0b0b] via-[#7a1f2b] to-[#c2410c]',
    glow: 'bg-orange-500',
    images: PICTURES,
  },
  {
    eyebrow: 'Move more, every day',
    title: 'Gear up for your workout',
    text: 'Yoga mats, dumbbells and resistance bands for home and gym.',
    cta: { label: 'Shop fitness', to: '/category/sports-and-fitness' },
    price: 'From ₹249',
    bg: 'from-[#03201a] via-[#065f46] to-[#0e7490]',
    glow: 'bg-emerald-400',
    images: PICTURES,
  },
]

const DURATION = 6500

export function HeroSlider() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const x = useSpring(pointerX, { stiffness: 60, damping: 15 })
  const y = useSpring(pointerY, { stiffness: 60, damping: 15 })
  const xFar = useTransform(x, (value) => value * -1.6)
  const yFar = useTransform(y, (value) => value * -1.6)

  const go = (next, dir) => {
    setDirection(dir)
    setIndex((next + SLIDES.length) % SLIDES.length)
  }

  useEffect(() => {
    if (paused) return undefined
    const timer = setTimeout(() => {
      setDirection(1)
      setIndex((value) => (value + 1) % SLIDES.length)
    }, DURATION)
    return () => clearTimeout(timer)
  }, [index, paused])

  const slide = SLIDES[index]

  return (
    <section
      className="force-dark relative overflow-hidden text-white"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => {
        setPaused(false)
        pointerX.set(0)
        pointerY.set(0)
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return
        const rect = event.currentTarget.getBoundingClientRect()
        pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 30)
        pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * 30)
      }}
      aria-roledescription="carousel"
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={cn('absolute inset-0 bg-linear-to-br', slide.bg)}
        >
          <div className={cn('absolute -right-20 top-10 size-[34rem] rounded-full opacity-50 blur-[120px] animate-blob', slide.glow)} />
          <div className="absolute inset-0 bg-dot-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        </motion.div>
      </AnimatePresence>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) go(index + 1, 1)
          else if (info.offset.x > 80) go(index - 1, -1)
        }}
        className="relative mx-auto grid min-h-[600px] max-w-7xl cursor-grab items-center gap-10 px-4 pb-24 pt-12 active:cursor-grabbing sm:px-6 lg:min-h-[640px] lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-16"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={`text-${index}`} initial={{ opacity: 0, x: direction * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -40 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
              <Sparkles className="size-3.5 text-amber-300" /> {slide.eyebrow}
            </span>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              <SplitText text={slide.title} delay={0.1} />
            </h1>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-6 max-w-lg text-lg text-white/75">{slide.text}</motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-9 flex flex-wrap items-center gap-4">
              <Link to={slide.cta.to} draggable={false} className="group relative inline-flex h-14 items-center gap-2 overflow-hidden rounded-full bg-white px-7 font-semibold text-[#101327] shadow-2xl shine-on-hover transition-transform hover:scale-[1.03]">
                {slide.cta.label}
                <span className="grid size-8 place-items-center rounded-full bg-[#101327] text-white transition-transform group-hover:translate-x-1"><ArrowRight className="size-4" /></span>
              </Link>
              <Link to="/shop" draggable={false} className="link-underline pb-1 font-semibold text-white/90">Browse everything</Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="relative mx-auto aspect-square w-full max-w-[520px]">
          {/* Rotating rings behind the products. */}
          <motion.div aria-hidden="true" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className="absolute inset-[6%] rounded-full border border-dashed border-white/20" />
          <motion.div aria-hidden="true" animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} className="absolute inset-[18%] rounded-full border border-white/10" />
          <AnimatePresence mode="wait">
            <motion.div key={`img-${index}`} className="absolute inset-0" initial="hidden" animate="show" exit="exit">
              <motion.div style={{ x, y }} className="absolute inset-[16%]">
                <motion.img
                  variants={{ hidden: { opacity: 0, scale: 0.7, rotate: -8, y: 40 }, show: { opacity: 1, scale: 1, rotate: 0, y: 0, transition: { type: 'spring', stiffness: 90, damping: 14 } }, exit: { opacity: 0, scale: 0.85, y: -30, transition: { duration: 0.3 } } }}
                  src={slide.images[0]}
                  alt=""
                  draggable={false}
                  className="size-full animate-float rounded-[2.5rem] object-cover shadow-[0_40px_80px_-20px_rgb(0_0_0/0.6)]"
                />
              </motion.div>
              {[{ src: slide.images[1], className: 'left-0 top-[8%] w-[30%]', delay: 0.15 }, { src: slide.images[2], className: 'bottom-[4%] right-0 w-[28%]', delay: 0.25 }].map((item) => (
                <motion.div key={item.className} style={{ x: xFar, y: yFar }} className={cn('absolute', item.className)}>
                  <motion.img
                    variants={{ hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 12, delay: item.delay } }, exit: { opacity: 0, scale: 0.6, transition: { duration: 0.2 } } }}
                    src={item.src}
                    alt=""
                    draggable={false}
                    className="w-full animate-float-slow rounded-3xl object-cover shadow-2xl ring-4 ring-white/10"
                  />
                </motion.div>
              ))}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { delay: 0.5 } }, exit: { opacity: 0 } }} className="absolute bottom-[18%] left-[2%] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-xl">
                <p className="text-xs text-white/70">Limited offer</p>
                <p className="font-display text-xl font-bold">{slide.price}</p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Controls: progress pills and arrows. */}
      <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2">
          {SLIDES.map((item, slideIndex) => (
            <button key={item.title} type="button" aria-label={`Slide ${slideIndex + 1}`} aria-current={slideIndex === index} onClick={() => go(slideIndex, slideIndex > index ? 1 : -1)} className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/25 sm:w-16">
              {slideIndex === index && (
                <motion.span key={`${index}-${paused}`} className="absolute inset-y-0 left-0 rounded-full bg-white" initial={{ width: paused ? '100%' : '0%' }} animate={{ width: '100%' }} transition={{ duration: paused ? 0 : DURATION / 1000, ease: 'linear' }} />
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[[ChevronLeft, -1, 'Previous slide'], [ChevronRight, 1, 'Next slide']].map(([Icon, dir, label]) => (
            <motion.button key={label} type="button" aria-label={label} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} onClick={() => go(index + dir, dir)} className="grid size-12 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur transition-colors hover:bg-white hover:text-[#101327]">
              <Icon className="size-5" />
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
