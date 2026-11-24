// Checkbox: a real <input type="checkbox"> (so forms, the keyboard and screen readers just work)
// with a custom look drawn on top of it. The tick draws itself when the box is checked.
//   <Checkbox label="Track stock" {...register('trackStock')} />
//   <Checkbox aria-label="Select row" checked={selected} onChange={(event) => toggle(event.target.checked)} />
import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/cn'

// The visible square. It is styled from the state of the invisible input next to it
// (`peer-checked:` and friends), so it is correct whether or not React controls the input.
const BOX = [
  'pointer-events-none absolute inset-0 rounded-md border border-line-strong shadow-xs',
  // White in the light theme, a touch lighter than the card behind it in the dark theme.
  'bg-[color-mix(in_oklab,var(--surface)_96%,white)]',
  'transition-[background-color,border-color,box-shadow,scale] duration-150 ease-out',
  'peer-hover:peer-enabled:ring-4 peer-hover:peer-enabled:ring-brand-500/15',
  'peer-active:peer-enabled:scale-90',
  'peer-aria-invalid:border-danger',
  'peer-checked:border-brand-600 peer-checked:bg-brand-600',
  'peer-checked:shadow-[0_2px_6px_-1px] peer-checked:shadow-brand-500/50',
  'peer-indeterminate:border-brand-600 peer-indeterminate:bg-brand-600',
  'peer-indeterminate:shadow-[0_2px_6px_-1px] peer-indeterminate:shadow-brand-500/50',
  // The keyboard focus ring belongs around the visible box, not the larger invisible input.
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500',
].join(' ')

// Both marks are lines that are fully "undrawn" (dash offset 1.1) until their state applies.
// --tick / --dash are set here and read by the two <path>s below.
const MARKS = [
  'pointer-events-none absolute inset-0 size-full text-white',
  '[--dash:1.1] [--tick:1.1]',
  'peer-[:checked:not(:indeterminate)]:[--tick:0] peer-indeterminate:[--dash:0]',
].join(' ')

// pathLength="1" lets the dash maths treat every line as exactly 1 unit long.
const STROKE = '[stroke-dasharray:1_2] transition-[stroke-dashoffset] ease-out'

/**
 * `onChange` receives the normal change event (read `event.target.checked`).
 * `indeterminate` shows a dash: "some, but not all" (the select-all box of a table).
 * Without `label` / `description` only the box is rendered: give it an `aria-label`.
 */
export function Checkbox({
  checked,
  onChange,
  indeterminate = false,
  label,
  description,
  disabled,
  className,
  id,
  ref,
  ...inputProps
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const descriptionId = `${inputId}-description`
  const inputRef = useRef(null)

  // "Indeterminate" is not an HTML attribute: it can only be switched on the DOM node itself.
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])

  // Keep our own reference to the <input> and still pass the node on to the caller's ref
  // (react-hook-form's register() hands us one).
  function attachRef(node) {
    inputRef.current = node
    if (typeof ref === 'function') return ref(node)
    if (ref) ref.current = node
    return undefined
  }

  const hasText = Boolean(label || description)

  const box = (
    <span
      className={cn(
        'relative inline-flex size-[18px] shrink-0',
        // With text, the <label> below is the root: it takes `className` and the disabled look.
        hasText ? 'mt-px' : ['has-[:disabled]:opacity-50', className],
      )}
    >
      {/* The real input: invisible and larger than the box, so it is easy to hit with a finger. */}
      <input
        ref={attachRef}
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        {...inputProps}
        className="peer absolute -top-2.5 -left-2.5 z-10 m-0 size-[38px] cursor-pointer appearance-none rounded-lg outline-hidden disabled:cursor-not-allowed"
      />
      <span aria-hidden="true" className={BOX} />
      <svg aria-hidden="true" viewBox="0 0 18 18" fill="none" className={MARKS}>
        <path
          d="M4.75 9.5 7.75 12.5 13.25 6.25"
          pathLength="1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(STROKE, 'delay-75 duration-200 [stroke-dashoffset:var(--tick)]')}
        />
        <path
          d="M5.25 9h7.5"
          pathLength="1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={cn(STROKE, 'duration-150 [stroke-dashoffset:var(--dash)]')}
        />
      </svg>
    </span>
  )

  if (!hasText) return box

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex w-fit max-w-full items-start gap-3 select-none',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
        className,
      )}
    >
      {box}
      <span className="flex min-w-0 flex-col gap-0.5">
        {label && <span className="text-sm leading-5 font-medium text-fg">{label}</span>}
        {description && (
          <span id={descriptionId} className="text-[13px] leading-5 text-fg-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  )
}
