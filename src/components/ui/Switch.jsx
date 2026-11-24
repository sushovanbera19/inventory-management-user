// Switch: an on/off toggle for a setting that applies right away (no "Save" needed).
//   <Switch label="Low stock alerts" description="Tell me when a product needs reordering"
//           checked={enabled} onChange={setEnabled} />
import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { spring } from '@/lib/motion'

// travel = how far the thumb slides in px: track width - thumb width - 2 x 2px inset.
const SIZES = {
  sm: { track: 'h-5 w-9', thumb: 'size-4', travel: 16 },
  md: { track: 'h-6 w-11', thumb: 'size-5', travel: 20 },
}

// The button's whileTap="pressed" reaches the thumb through this variant: while the switch
// is held down the thumb shrinks a little, like a real button being pushed in.
const THUMB_VARIANTS = { pressed: { scale: 0.86 } }

/**
 * Controlled: pass `checked` and `onChange(nextChecked)` (a boolean, not an event).
 * With `label` / `description` it renders a full row (text left, switch right);
 * without them only the switch, which then needs an `aria-label`.
 */
export function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  id,
  className,
  ...rest
}) {
  const autoId = useId()
  const switchId = id ?? autoId
  const descriptionId = `${switchId}-description`
  const dimensions = SIZES[size] ?? SIZES.md
  const hasText = Boolean(label || description)

  const control = (
    <motion.button
      whileTap={disabled ? undefined : 'pressed'}
      {...rest}
      type="button"
      role="switch"
      id={switchId}
      aria-checked={checked}
      aria-describedby={description ? descriptionId : rest['aria-describedby']}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex shrink-0 rounded-full bg-line-strong inset-shadow-xs',
        'transition-colors duration-200 enabled:hover:bg-fg-subtle/60',
        // An invisible border of 8px around the track makes it comfortable to tap.
        'before:absolute before:-inset-2',
        dimensions.track,
        // With text, the row below is the root: it takes `className` and the disabled look.
        !hasText && [disabled && 'opacity-50', className],
      )}
    >
      {/* The "on" colour is its own layer, so it can fade in (a gradient cannot be transitioned). */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-brand shadow-[0_4px_12px_-4px] shadow-brand-500/60',
          'transition-opacity duration-200',
          checked ? 'opacity-100' : 'opacity-0',
        )}
      />
      <motion.span
        aria-hidden="true"
        className={cn(
          'absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm ring-1 ring-black/5',
          dimensions.thumb,
        )}
        // initial={false}: a switch that starts "on" is simply drawn on, it does not slide in.
        initial={false}
        animate={{ x: checked ? dimensions.travel : 0 }}
        variants={THUMB_VARIANTS}
        transition={spring.snappy}
      />
    </motion.button>
  )

  if (!hasText) return control

  return (
    <div
      className={cn(
        'flex justify-between gap-4',
        description ? 'items-start' : 'items-center',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* A <label> pointing at the button: clicking the text flips the switch too. */}
        {label && (
          <label
            htmlFor={switchId}
            className={cn('text-sm leading-5 font-medium text-fg', disabled && 'cursor-not-allowed')}
          >
            {label}
          </label>
        )}
        {description && (
          <p id={descriptionId} className="text-[13px] leading-5 text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {control}
    </div>
  )
}
