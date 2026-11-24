// SegmentedControl: pick exactly one of a few options (a date range, a movement type).
// The highlighted "thumb" glides from the old choice to the new one.
//   <SegmentedControl value={range} onChange={setRange} options={[{ value: '7d', label: '7D' }, …]} />
import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { spring } from '@/lib/motion'

// The track is 32 / 40 / 48px tall. Options fill its whole height (a comfortable tap target);
// the thumb is drawn 4px inside them.
const SIZES = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-12 px-5 text-sm',
}

/**
 * Behaves like a group of radio buttons: Tab reaches the selected option, the arrow keys
 * move the selection, Home / End jump to the first / last option.
 * `options` is a list of { value, label, icon? }; `icon` is an element (<Package />).
 */
export function SegmentedControl({
  value,
  onChange,
  options = [],
  size = 'md',
  fullWidth,
  className,
  'aria-label': ariaLabel,
  ...rest
}) {
  // Every instance needs its own layoutId: motion animates between elements that share one,
  // so two controls using the same id would send their thumbs flying across the page.
  const thumbId = useId()

  const selectedIndex = options.findIndex((option) => option.value === value)
  // Tab must be able to land somewhere even when nothing is selected yet.
  const tabStopIndex = selectedIndex === -1 ? 0 : selectedIndex

  function handleKeyDown(event, index) {
    const last = options.length - 1
    let nextIndex = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = index === 0 ? last : index - 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = last
    if (nextIndex == null) return

    event.preventDefault()
    // Move focus with the selection, the way native radio buttons do.
    event.currentTarget.parentElement?.querySelectorAll('[role="radio"]')[nextIndex]?.focus()
    onChange?.(options[nextIndex].value)
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'max-w-full rounded-xl bg-surface-3 inset-shadow-xs',
        fullWidth ? 'flex w-full' : 'inline-flex',
        className,
      )}
      {...rest}
    >
      {options.map((option, index) => {
        const selected = index === selectedIndex
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === tabStopIndex ? 0 : -1}
            onClick={() => onChange?.(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'group relative inline-flex min-w-0 items-center justify-center rounded-xl font-medium whitespace-nowrap',
              'transition-colors duration-200',
              fullWidth && 'flex-1',
              selected ? 'text-fg' : 'text-fg-muted hover:text-fg',
              SIZES[size] ?? SIZES.md,
            )}
          >
            {selected && (
              <motion.span
                layoutId={`segmented-thumb-${thumbId}`}
                aria-hidden="true"
                // White in the light theme, lighter than the track in the dark theme.
                className="absolute inset-1 bg-[color-mix(in_oklab,var(--surface)_84%,white)] shadow-sm ring-1 ring-fg/5"
                // The radius is a style (not a class) so motion can keep the corners round
                // while it stretches the thumb between options of different widths.
                style={{ borderRadius: 8 }}
                transition={spring.snappy}
              />
            )}
            {/* The label sits above the thumb and dips slightly while the option is pressed. */}
            <span className="relative inline-flex min-w-0 items-center gap-1.5 transition-[scale] duration-150 ease-out group-active:scale-95 [&_svg]:size-4 [&_svg]:shrink-0">
              {option.icon}
              <span className="truncate">{option.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
