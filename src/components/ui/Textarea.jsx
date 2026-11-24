// Textarea: a multi-line text field (notes, descriptions, addresses) that looks exactly like
// Input and takes the same label / hint / error props.
import { useId } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field.jsx'
import { describedByFor, errorMessageOf, fieldControl, fieldShellClass, isMessage } from './fieldStyles.js'

/**
 * `className` styles the visible box, `containerClassName` the outer wrapper (see Input).
 * The box can be dragged taller by its bottom-right corner; `rows` sets the starting height.
 */
export function Textarea({
  label,
  hint,
  error,
  required,
  optional,
  rows = 3,
  className,
  containerClassName,
  id,
  ref,
  ...props
}) {
  const autoId = useId()
  const textareaId = id ?? autoId
  const invalid = Boolean(error)
  const { disabled, readOnly } = props

  // Same trick as Input: the wrapper always exists (stable React tree) but only takes part
  // in the layout when it has a label or a message to show.
  const bare = !label && !optional && !isMessage(hint) && errorMessageOf(error) == null

  return (
    <Field
      label={label}
      htmlFor={textareaId}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={bare ? 'contents' : containerClassName}
    >
      <div
        className={cn(
          fieldShellClass({ invalid, disabled }),
          readOnly && 'bg-surface-2',
          bare && containerClassName,
          className,
        )}
      >
        <textarea
          ref={ref}
          id={textareaId}
          data-control=""
          rows={rows}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          {...props}
          aria-describedby={describedByFor(textareaId, { hint, error }, props['aria-describedby'])}
          className={cn(fieldControl, 'min-h-10 resize-y px-3.5 py-2.5 leading-relaxed')}
        />
      </div>
    </Field>
  )
}
