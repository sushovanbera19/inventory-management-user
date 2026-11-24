// Select: the browser's own dropdown (great on phones and with a keyboard), dressed like Input.
//   <Select label="Category" options={[{ value: 'cat_1', label: 'Electronics' }]} placeholder="Choose…" />
import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Field } from './Field.jsx'
import {
  describedByFor,
  errorMessageOf,
  fieldControl,
  fieldHeights,
  fieldShellClass,
  isMessage,
} from './fieldStyles.js'

// Left padding per size. The right side always leaves room for the chevron.
const PADDING = {
  sm: 'pl-2.5 pr-8',
  md: 'pl-3.5 pr-9',
  lg: 'pl-4 pr-10',
}

/**
 * `options` is a list of { value, label, disabled? }; extra <option> / <optgroup> elements can
 * be passed as children. `placeholder` adds a first, empty choice and is shown in a muted
 * colour while it is the selected one.
 * `className` styles the visible box, `containerClassName` the outer wrapper (see Input).
 */
export function Select({
  label,
  hint,
  error,
  required,
  optional,
  options,
  placeholder,
  size = 'md',
  className,
  containerClassName,
  id,
  ref,
  children,
  ...selectProps
}) {
  const autoId = useId()
  const selectId = id ?? autoId
  const invalid = Boolean(error)
  const { disabled } = selectProps

  // Same trick as Input: the wrapper always exists (stable React tree) but only takes part
  // in the layout when it has a label or a message to show.
  const bare = !label && !optional && !isMessage(hint) && errorMessageOf(error) == null

  return (
    <Field
      label={label}
      htmlFor={selectId}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={bare ? 'contents' : containerClassName}
    >
      <div
        className={cn(
          fieldShellClass({ invalid, disabled }),
          fieldHeights[size] ?? fieldHeights.md,
          bare && containerClassName,
          className,
        )}
      >
        <select
          ref={ref}
          id={selectId}
          data-control=""
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          {...selectProps}
          aria-describedby={describedByFor(selectId, { hint, error }, selectProps['aria-describedby'])}
          className={cn(
            fieldControl,
            'h-full truncate',
            PADDING[size] ?? PADDING.md,
            // Muted text while the placeholder is the selected option.
            'has-[option[data-placeholder]:checked]:text-fg-subtle',
            // The opened list is drawn by the browser; give its rows the theme colours where it lets us.
            '[&_optgroup]:bg-surface [&_optgroup]:text-fg-muted [&_option]:bg-surface [&_option]:text-fg',
          )}
        >
          {placeholder != null && (
            <option value="" data-placeholder="">
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {children}
        </select>

        <ChevronDown
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-fg-subtle transition-colors duration-200',
            'group-hover/field:text-fg-muted group-has-[[data-control]:focus]/field:text-fg-muted',
            size === 'sm' ? 'right-2.5' : 'right-3',
          )}
        />
      </div>
    </Field>
  )
}
