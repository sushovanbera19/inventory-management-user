// Visual effects used across the shop: 3D tilt cards, marquees, drag carousels, count-ups,
// scroll progress, back-to-top and a spotlight that follows the pointer.
import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Tilts in 3D towards the pointer, with a soft glare and a coloured spotlight. Mouse only. */
export function TiltCard({ children, className, max = 8, glare = true, ...rest }) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 220, damping: 18 })
  const rotateY = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 220, damping: 18 })
  const glareX = useTransform(x, (value) => `${value * 100}%`)
  const glareY = useTransform(y, (value) => `${value * 100}%`)
  const background = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.22), transparent 45%)`

  return (
    <motion.div
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return
        const rect = event.currentTarget.getBoundingClientRect()
        x.set((event.clientX - rect.left) / rect.width)
        y.set((event.clientY - rect.top) / rect.height)
      }}
      onPointerLeave={() => {
        x.set(0.5)
        y.set(0.5)
      }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cn('group/tilt relative', className)}
      {...rest}
    >
      {children}
      {glare && <motion.span aria-hidden="true" style={{ background }} className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100" />}
    </motion.div>
  )
}

/** An endless horizontal strip. Pauses on hover. `reverse` scrolls the other way. */
export function Marquee({ children, duration = 30, reverse = false, className }) {
  return (
    <div className={cn('group/marquee mask-fade-x flex overflow-hidden', className)}>
      <div
        className="animate-marquee flex w-max shrink-0 group-hover/marquee:[animation-play-state:paused]"
        style={{ '--marquee-duration': `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">{children}</div>
      </div>
    </div>
  )
}

/** Horizontal slider: scroll, swipe or drag with the mouse, plus arrow buttons and a progress bar. */
export function Carousel({ children, className, itemClassName = 'w-[72%] sm:w-[44%] lg:w-[23.5%]', label = 'Carousel' }) {
  const trackRef = useRef(null)
  const drag = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false, progress: 0 })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    const update = () => {
      const max = track.scrollWidth - track.clientWidth
      const next = { start: track.scrollLeft < 4, end: track.scrollLeft > max - 4, progress: max > 0 ? track.scrollLeft / max : 0 }
      setEdges((current) => (current.start === next.start && current.end === next.end && Math.abs(current.progress - next.progress) < 0.01 ? current : next))
    }
    update()
    track.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      track.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  function scrollBy(direction) {
    const track = trackRef.current
    track?.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  // Mouse drag-to-scroll (touch already scrolls natively).
  function onPointerDown(event) {
    if (event.pointerType !== 'mouse') return
    drag.current = { x: event.clientX, left: trackRef.current.scrollLeft, moved: false }
  }
  function onPointerMove(event) {
    if (!drag.current) return
    const dx = event.clientX - drag.current.x
    if (Math.abs(dx) > 5) drag.current.moved = true
    trackRef.current.scrollLeft = drag.current.left - dx
  }
  function onPointerUp() {
    setTimeout(() => {
      drag.current = null
    }, 0)
  }

  const items = Array.isArray(children) ? children : [children]
  return (
    <div className={cn('relative', className)} role="region" aria-label={label}>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClickCapture={(event) => {
          if (drag.current?.moved) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 pt-2 active:cursor-grabbing sm:mx-0 sm:px-0"
      >
        {items.map((child, index) => (
          <div key={child?.key ?? index} className={cn('shrink-0 snap-start', itemClassName)}>{child}</div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
          <motion.div className="h-full rounded-full bg-gradient-brand" animate={{ width: `${Math.max(12, edges.progress * 100)}%` }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} />
        </div>
        <div className="flex gap-2">
          {[[-1, ChevronLeft, edges.start, 'Previous'], [1, ChevronRight, edges.end, 'Next']].map(([direction, Icon, disabled, name]) => (
            <motion.button key={name} type="button" aria-label={name} disabled={disabled} whileTap={{ scale: 0.9 }} onClick={() => scrollBy(direction)}
              className="grid size-11 place-items-center rounded-full border border-line bg-surface shadow-card transition-all hover:border-brand-500 hover:bg-brand-600 hover:text-white disabled:pointer-events-none disabled:opacity-35">
              <Icon className="size-5" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Counts up from 0 the first time it scrolls into view. */
export function CountUp({ to, suffix = '', decimals = 0, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  useEffect(() => {
    if (!inView || !ref.current) return undefined
    const controls = animate(0, to, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        if (ref.current) ref.current.textContent = `${value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
      },
    })
    return () => controls.stop()
  }, [inView, to, suffix, decimals])
  return <span ref={ref} className={cn('tabular-nums', className)}>0{suffix}</span>
}

/** Thin gradient bar at the very top showing how far the page is scrolled. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })
  return <motion.div aria-hidden="true" style={{ scaleX }} className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-linear-to-r from-brand-500 via-fuchsia-500 to-amber-400" />
}

/** Round button that appears after scrolling down and glides back to the top. */
export function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <motion.button
      type="button"
      aria-label="Back to top"
      initial={false}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.8 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      className={cn('fixed bottom-5 right-5 z-30 grid size-12 place-items-center rounded-full bg-gradient-brand text-white shadow-glow', !show && 'pointer-events-none')}
    >
      <ArrowUp className="size-5" />
    </motion.button>
  )
}

/** A section whose background glows where the pointer is. */
export function Spotlight({ children, className, color = 'rgb(112 99 247 / 0.16)' }) {
  const x = useMotionValue(-500)
  const y = useMotionValue(-500)
  const background = useMotionTemplate`radial-gradient(520px circle at ${x}px ${y}px, ${color}, transparent 70%)`
  return (
    <div
      className={cn('group/spot relative', className)}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        x.set(event.clientX - rect.left)
        y.set(event.clientY - rect.top)
      }}
    >
      <motion.div aria-hidden="true" style={{ background }} className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100" />
      {children}
    </div>
  )
}

/** Words that rise into place one after another. */
export function SplitText({ text, className, delay = 0 }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden="true">
          <motion.span className="inline-block" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: delay + index * 0.06 }}>
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  )
}
