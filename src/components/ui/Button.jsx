// Buttons: every clickable action in the app.
// <Button> renders a real <button>, a router <Link> (pass `to`) or a plain <a> (pass `href`).
// <IconButton> is the square, icon-only version; it shows its label as a tooltip.
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { duration, ease, spring } from '@/lib/motion'
import { Spinner } from './Spinner.jsx'
import { Tooltip } from './Tooltip.jsx'

// A router Link that motion can animate. It is created once, here: creating a component
// inside another component would hand React a brand-new component type on every render.
const MotionLink = motion.create(Link)

/** The physical "press": the button shrinks a little while it is held down. */
const PRESS = { scale: 0.97 }

const BASE = [
  'relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-xl font-medium',
  // `transform` is left out on purpose: motion animates it for the press, and a CSS transition
  // on the same property would fight that animation. The hover lift uses `translate` instead.
  'transition-[color,background-color,border-color,box-shadow,translate,filter,opacity] duration-200 ease-out',
  '[&_svg]:size-4 [&_svg]:shrink-0',
].join(' ')

// Label colour on the solid danger / success fills. It is white in the light theme; the dark
// theme uses bright tone colours, where white would be unreadable, so there the label takes
// the dark surface colour instead.
const ON_TONE = 'text-surface'

// Each look has three parts:
//   base        – always applied
//   depth       – the resting shadow (dropped when the button is disabled)
//   interactive – hover / pressed feedback (only while the button can be used)
const VARIANTS = {
  primary: {
    base: [
      'isolate bg-gradient-brand text-white',
      // A thin light line along the top edge plus a soft sheen: the button reads as slightly raised.
      'inset-shadow-[0_1px_0_rgb(255_255_255/0.28)]',
      'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit]',
      'before:bg-linear-to-b before:from-white/15 before:to-transparent',
    ].join(' '),
    depth: 'shadow-glow-sm',
    interactive: [
      'hover:-translate-y-px hover:shadow-glow hover:brightness-110',
      'active:translate-y-0 active:shadow-glow-sm active:brightness-95',
    ].join(' '),
  },
  secondary: {
    base: 'border border-line bg-surface text-fg',
    depth: 'shadow-xs',
    interactive: 'hover:border-line-strong hover:bg-surface-2 active:bg-surface-3',
  },
  outline: {
    base: 'border border-line-strong text-fg',
    // A see-through tint (not a fixed colour) so the hover shows on any background.
    interactive: 'hover:bg-fg/5 active:bg-fg/10',
  },
  ghost: {
    base: 'text-fg-muted',
    interactive: 'hover:bg-fg/6 hover:text-fg active:bg-fg/10',
  },
  soft: {
    base: 'bg-brand-soft text-brand-fg',
    interactive: 'hover:bg-brand-500/25 active:bg-brand-500/30',
  },
  danger: {
    base: `bg-danger ${ON_TONE} inset-shadow-[0_1px_0_rgb(255_255_255/0.22)]`,
    depth: 'shadow-[0_6px_16px_-8px] shadow-danger/60',
    interactive: [
      'hover:-translate-y-px hover:shadow-[0_10px_24px_-10px] hover:brightness-105',
      'active:translate-y-0 active:brightness-95',
    ].join(' '),
  },
  'danger-soft': {
    base: 'bg-danger-soft text-danger-fg',
    interactive: 'hover:bg-danger/25 active:bg-danger/30',
  },
  success: {
    base: `bg-success ${ON_TONE} inset-shadow-[0_1px_0_rgb(255_255_255/0.22)]`,
    depth: 'shadow-[0_6px_16px_-8px] shadow-success/60',
    interactive: [
      'hover:-translate-y-px hover:shadow-[0_10px_24px_-10px] hover:brightness-105',
      'active:translate-y-0 active:brightness-95',
    ].join(' '),
  },
}

const SIZES = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base [&_svg]:size-5',
}

// Square sizes for IconButton: 32 / 40 / 44px.
const ICON_SIZES = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-11 [&_svg]:size-5',
}

/** The spinner is drawn at the same size as the icons of that button size. */
function spinnerSizeFor(size) {
  return size === 'lg' ? 'md' : 'sm'
}

/**
 * The element itself: picks <button>, <Link> or <a>, applies the look and the press animation.
 * Button and IconButton only differ in what they put inside it.
 */
function ButtonRoot({ variant, loading, disabled, to, href, type = 'button', className, children, ...rest }) {
  const look = VARIANTS[variant] ?? VARIANTS.primary
  const inactive = Boolean(disabled || loading)

  const classes = cn(
    BASE,
    look.base,
    // Disabled: flat and dimmed. Loading: keeps its look, but shows a "busy" cursor.
    disabled ? 'cursor-not-allowed opacity-50' : look.depth,
    loading && !disabled && 'cursor-progress',
    !inactive && look.interactive,
    className,
  )

  const press = { whileTap: inactive ? undefined : PRESS, transition: spring.snappy }
  const busy = loading ? true : undefined

  if (to != null || href != null) {
    if (inactive) {
      // A link cannot be disabled like a button. An anchor without a destination is neither
      // focusable nor clickable, and aria-disabled tells screen readers why.
      return (
        <motion.a
          {...rest}
          role="link"
          aria-disabled="true"
          aria-busy={busy}
          onClick={undefined}
          className={classes}
        >
          {children}
        </motion.a>
      )
    }

    if (to != null) {
      return (
        <MotionLink {...press} to={to} {...rest} className={classes}>
          {children}
        </MotionLink>
      )
    }

    // Links that open a new tab must not hand the new page a reference to this one.
    const rel = rest.rel ?? (rest.target === '_blank' ? 'noopener noreferrer' : undefined)
    return (
      <motion.a {...press} href={href} {...rest} rel={rel} className={classes}>
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      {...press}
      {...rest}
      type={type}
      disabled={inactive}
      aria-busy={busy}
      className={classes}
    >
      {children}
    </motion.button>
  )
}

/** An icon that cross-fades into a spinner (and back) without changing size. */
function IconSwap({ icon, loading, spinnerSize }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <span
        className={cn(
          'inline-flex transition-[opacity,scale] duration-150 ease-out',
          loading && 'scale-50 opacity-0',
        )}
      >
        {icon}
      </span>
      <AnimatePresence initial={false}>
        {loading && (
          <motion.span
            key="spinner"
            className="absolute inset-0 grid place-items-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: duration.fast, ease: ease.out }}
          >
            <Spinner size={spinnerSize} className="text-current" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/**
 * Spinner for a button that has no left icon: it grows in from zero width, so the label
 * glides aside instead of jumping.
 */
function GrowingSpinner({ loading, size }) {
  const small = size === 'sm'
  return (
    <AnimatePresence initial={false}>
      {loading && (
        <motion.span
          key="spinner"
          // The negative margin cancels the button's own gap while this slot is collapsed;
          // the matching padding inside gives the gap back once it is open.
          className={cn('inline-flex shrink-0 overflow-hidden', small ? '-mr-1.5' : '-mr-2')}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: duration.fast, ease: ease.out }}
        >
          <span className={cn('inline-flex', small ? 'pr-1.5' : 'pr-2')}>
            <Spinner size={spinnerSizeFor(size)} className="text-current" />
          </span>
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/**
 * variant: primary | secondary | outline | ghost | soft | danger | danger-soft | success
 * size:    sm | md | lg
 * `loading` shows a spinner in place of the left icon and blocks clicks.
 * `leftIcon` / `rightIcon` take an element: leftIcon={<Plus />}.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth,
  to,
  href,
  type = 'button',
  className,
  children,
  ...rest
}) {
  return (
    <ButtonRoot
      variant={variant}
      loading={loading}
      disabled={disabled}
      to={to}
      href={href}
      type={type}
      className={cn(SIZES[size] ?? SIZES.md, fullWidth && 'w-full', className)}
      {...rest}
    >
      {leftIcon ? (
        <IconSwap icon={leftIcon} loading={loading} spinnerSize={spinnerSizeFor(size)} />
      ) : (
        <GrowingSpinner loading={loading} size={size} />
      )}
      {children}
      {rightIcon}
    </ButtonRoot>
  )
}

/**
 * Square button that shows only an icon. `label` is required: it is the accessible name
 * and the tooltip text.   <IconButton label="Edit product"><Pencil /></IconButton>
 */
export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  loading = false,
  to,
  tooltip = true,
  tooltipSide = 'top',
  className,
  children,
  ...rest
}) {
  const button = (
    <ButtonRoot
      variant={variant}
      loading={loading}
      to={to}
      aria-label={label}
      className={cn(ICON_SIZES[size] ?? ICON_SIZES.md, className)}
      {...rest}
    >
      <IconSwap icon={children} loading={loading} spinnerSize={spinnerSizeFor(size)} />
    </ButtonRoot>
  )

  if (!tooltip || !label) return button

  return (
    <Tooltip content={label} side={tooltipSide}>
      {button}
    </Tooltip>
  )
}
