/**
 * Shared motion language for the whole app (used with `motion/react`).
 * Import presets from here instead of hand-writing durations and easings,
 * so every screen moves the same way.
 *
 * Variant states are always named:  hidden -> show -> exit
 *   <motion.div variants={fadeUp} initial="hidden" animate="show" exit="exit" />
 */

export const ease = {
  out: [0.16, 1, 0.3, 1],
  soft: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
}

export const duration = {
  instant: 0.1,
  fast: 0.16,
  base: 0.24,
  slow: 0.4,
  slower: 0.6,
}

export const spring = {
  /** Small UI: toggles, indicators, tabs. */
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
  /** Panels: modals, drawers, cards. */
  smooth: { type: 'spring', stiffness: 280, damping: 28 },
  /** Slow, soft settling: large layout shifts. */
  gentle: { type: 'spring', stiffness: 170, damping: 22 },
  /** Playful overshoot: badges, success ticks. */
  bouncy: { type: 'spring', stiffness: 420, damping: 16 },
}

/* ---------- Entrances ----------------------------------------------------- */

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
  exit: { opacity: 0, y: 8, transition: { duration: duration.fast } },
}

export const fadeDown = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.fast } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: spring.smooth },
  exit: { opacity: 0, scale: 0.96, transition: { duration: duration.fast } },
}

export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: ease.out } },
  exit: { opacity: 0, x: 16, transition: { duration: duration.fast } },
}

export const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: ease.out } },
  exit: { opacity: 0, x: -16, transition: { duration: duration.fast } },
}

/* ---------- Lists --------------------------------------------------------- */

/** Parent variants that reveal children one after another. */
export const staggerContainer = (stagger = 0.06, delayChildren = 0.02) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
  exit: {},
})

/** Child of a stagger container: table rows, list items, small cards. */
export const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: ease.out } },
  exit: { opacity: 0, x: -8, transition: { duration: duration.fast } },
}

/* ---------- Pages & overlays ---------------------------------------------- */

export const pageTransition = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: ease.out } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14, ease: 'easeIn' } },
}

export const overlayFade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18, delay: 0.04 } },
}

/** Centered dialog panel. */
export const modalPanel = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring.smooth },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16, ease: 'easeIn' } },
}

/** Bottom sheet (dialogs on phones). */
export const sheetPanel = {
  hidden: { y: '100%' },
  show: { y: 0, transition: spring.smooth },
  exit: { y: '100%', transition: { duration: 0.22, ease: ease.inOut } },
}

/** Side drawer. */
export const drawerPanel = (side = 'right') => {
  const offscreen = side === 'left' ? '-100%' : '100%'
  return {
    hidden: { x: offscreen },
    show: { x: 0, transition: spring.smooth },
    exit: { x: offscreen, transition: { duration: 0.22, ease: ease.inOut } },
  }
}

/** Menus, popovers, tooltips. */
export const popIn = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.fast, ease: ease.out } },
  exit: { opacity: 0, scale: 0.97, y: -2, transition: { duration: duration.instant } },
}

/** Toast notifications. */
export const toastMotion = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring.smooth },
  exit: { opacity: 0, x: 48, scale: 0.96, transition: { duration: 0.2, ease: 'easeIn' } },
}

/* ---------- Gestures ------------------------------------------------------ */

/** Spread onto a motion element: <motion.button {...tap} /> */
export const tap = { whileTap: { scale: 0.97 } }

/** Cards that lift on hover. */
export const hoverLift = {
  whileHover: { y: -3, transition: spring.snappy },
  whileTap: { scale: 0.985 },
}

/** Default viewport options for whileInView reveals. */
export const viewportOnce = { once: true, margin: '-60px' }
