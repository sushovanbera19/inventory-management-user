// Small animation wrappers, so pages get the shared motion language without
// writing motion props by hand:
//   <FadeIn>…</FadeIn>                        one element fades up when it mounts
//   <Stagger><StaggerItem/>…</Stagger>        children appear one after another
//   <Reveal>…</Reveal>                        fades up the first time it scrolls into view
// `as="ul"` renders another tag: motion keeps one ready-made component per HTML tag (motion.ul, motion.li …).
import { useMemo } from 'react'
import { motion } from 'motion/react'
import { duration as durations, ease, fadeUp, staggerContainer, viewportOnce } from '@/lib/motion'

/**
 * Fades (and slides up by `y` pixels) once, when it mounts.
 * It uses plain objects instead of variant names on purpose: variant names
 * travel down to every Card / StaggerItem inside, objects do not.
 */
export function FadeIn({ delay = 0, y = 12, duration, className, children, as = 'div', ...rest }) {
  const Component = motion[as]

  return (
    <Component
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration ?? durations.slow, ease: ease.out, delay }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  )
}

/**
 * Container that reveals its children in sequence. The children must be
 * <StaggerItem> or <Card> (anything with `variants`): the names "hidden" and
 * "show" set here are passed down to them automatically.
 */
export function Stagger({ stagger = 0.06, delay = 0, className, children, as = 'div', ...rest }) {
  const Component = motion[as]
  const variants = useMemo(() => staggerContainer(stagger, delay), [stagger, delay])

  return (
    <Component variants={variants} initial="hidden" animate="show" className={className} {...rest}>
      {children}
    </Component>
  )
}

/** One child of <Stagger>. Outside a Stagger it simply renders without animating. */
export function StaggerItem({ className, children, as = 'div', ...rest }) {
  const Component = motion[as]

  return (
    <Component variants={fadeUp} className={className} {...rest}>
      {children}
    </Component>
  )
}

/** Fades up the first time it is scrolled into view (for content below the fold). */
export function Reveal({ delay = 0, className, children, ...rest }) {
  return (
    <motion.div
      initial={fadeUp.hidden}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: durations.slow, ease: ease.out, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
