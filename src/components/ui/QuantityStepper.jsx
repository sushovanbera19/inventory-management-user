// QuantityStepper: minus button, number box, plus button (order line quantities, stock counts).
//   <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={product.stock} />
import { useState } from 'react'
import { motion } from 'motion/react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { clamp } from '@/lib/format'
import { spring } from '@/lib/motion'
import { fieldControl, fieldHeights, fieldShellClass } from './fieldStyles.js'

const SIZES = {
  sm: { button: 'w-8', input: 'w-9' },
  md: { button: 'w-10', input: 'w-12' },
  lg: { button: 'w-11', input: 'w-14' },
}

/** How many digits `step` has after the decimal point: 1 -> 0, 0.5 -> 1, 0.25 -> 2. */
function decimalPlaces(step) {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

/** Typed text -> a number, or null while it is not a number yet ("", "-", "."). */
function parseNumber(text) {
  if (text.trim() === '') return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

/** Drop every character that cannot be part of the number (letters, a second dot…). */
function cleanInput(text, { allowDecimal, allowNegative }) {
  const negative = allowNegative && text.trimStart().startsWith('-')
  let digits = text.replace(allowDecimal ? /[^\d.]/g : /\D/g, '')
  if (allowDecimal) {
    const [whole, ...fraction] = digits.split('.')
    digits = fraction.length > 0 ? `${whole}.${fraction.join('')}` : whole
  }
  return negative ? `-${digits}` : digits
}

/** One of the two round-cornered buttons at the ends of the stepper. */
function StepButton({ label, blocked, disabled, onPress, className, children }) {
  const inert = blocked || disabled
  return (
    <motion.button
      type="button"
      aria-label={label}
      // At a limit the button is only *marked* disabled. A truly disabled button would drop
      // keyboard focus onto the page the moment the limit is reached.
      aria-disabled={blocked || undefined}
      disabled={disabled}
      // The number box handles the keyboard (arrow keys), so these stay out of the Tab order.
      tabIndex={-1}
      onClick={inert ? undefined : onPress}
      whileTap={inert ? undefined : { scale: 0.88 }}
      transition={spring.snappy}
      className={cn(
        'grid h-full shrink-0 place-items-center text-fg-muted transition-colors duration-150',
        'focus-visible:-outline-offset-2 [&_svg]:size-4',
        inert ? 'cursor-not-allowed' : 'hover:bg-fg/6 hover:text-fg active:bg-fg/10',
        // When the whole stepper is disabled the box is already dimmed as one piece.
        blocked && !disabled && 'opacity-40',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}

/**
 * Controlled: `value` is a number and `onChange(nextNumber)` receives the new one.
 * Typing is allowed. A number inside min…max is reported straight away; anything else is
 * pulled back into range when the box loses focus. Arrow up / down step the value too.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Infinity,
  step = 1,
  size = 'md',
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Quantity',
  ...rest
}) {
  // The text while the user is typing. null means "not typing: show the value from props".
  const [draft, setDraft] = useState(null)

  const dimensions = SIZES[size] ?? SIZES.md
  const decimals = decimalPlaces(step)
  const current = parseNumber(String(value ?? ''))
  const shown = draft ?? (current == null ? '' : String(current))

  /** Pull a number into min…max, trim float noise (0.1 + 0.2) and tell the parent if it changed. */
  function commit(number) {
    const next = Number(clamp(number, min, max).toFixed(decimals))
    if (next !== current) onChange?.(next)
  }

  function handleChange(event) {
    const text = cleanInput(event.target.value, { allowDecimal: decimals > 0, allowNegative: min < 0 })
    setDraft(text)
    // Report numbers that are already valid, so totals follow along while typing.
    const typed = parseNumber(text)
    if (typed != null && typed >= min && typed <= max && typed !== current) onChange?.(typed)
  }

  /** Typing is over: bring the number into range. Text that is not a number is simply dropped. */
  function finishTyping() {
    if (draft == null) return
    const typed = parseNumber(draft)
    if (typed != null) commit(typed)
    setDraft(null)
  }

  function stepBy(direction) {
    const base = parseNumber(draft ?? '') ?? current
    // With no number yet, the first press starts at the minimum.
    if (base == null) commit(Number.isFinite(min) ? min : 0)
    else commit(base + direction * step)
    setDraft(null)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      stepBy(1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      stepBy(-1)
    } else if (event.key === 'Enter') {
      // Settle the number before a surrounding form reads it.
      finishTyping()
    }
  }

  return (
    <div
      className={cn(
        fieldShellClass({ disabled }),
        'inline-flex w-auto text-center font-medium tabular-nums',
        fieldHeights[size] ?? fieldHeights.md,
        className,
      )}
      {...rest}
    >
      <StepButton
        label="Decrease quantity"
        blocked={current != null && current <= min}
        disabled={disabled}
        onPress={() => stepBy(-1)}
        className={dimensions.button}
      >
        <Minus />
      </StepButton>

      <input
        data-control=""
        type="text"
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        role="spinbutton"
        aria-label={ariaLabel}
        aria-valuenow={current ?? undefined}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        autoComplete="off"
        disabled={disabled}
        value={shown}
        onChange={handleChange}
        onBlur={finishTyping}
        // Select the number on focus, so typing replaces it instead of adding digits.
        onFocus={(event) => event.target.select()}
        onKeyDown={handleKeyDown}
        className={cn(fieldControl, 'h-full px-1', dimensions.input)}
      />

      <StepButton
        label="Increase quantity"
        blocked={current != null && current >= max}
        disabled={disabled}
        onPress={() => stepBy(1)}
        className={dimensions.button}
      >
        <Plus />
      </StepButton>
    </div>
  )
}
