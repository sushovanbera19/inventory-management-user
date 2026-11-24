// Input: a text field with an optional label, hint and error message, and room inside the
// box for an icon, a prefix / suffix ("%", "pcs", a currency symbol) or a small button.
// With react-hook-form:  <Input label="SKU" error={errors.sku?.message} {...register('sku', rules)} />
import { useId } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field.jsx'
import {
  describedByFor,
  errorMessageOf,
  fieldControl,
  fieldHeights,
  fieldPadding,
  fieldShellClass,
  focusControlOnPress,
  isMessage,
} from './fieldStyles.js'

/** Anything that sits inside the box next to the text: icon, prefix, suffix, right element. */
const ADORNMENT = 'flex h-full shrink-0 select-none items-center whitespace-nowrap'

/**
 * `className` styles the visible box (width, font, text alignment…); `containerClassName`
 * styles the outer wrapper that also holds the label and the message (grid / flex placement).
 * `required` draws the asterisk and sets aria-required. It does not switch on the browser's
 * own validation popups: validation belongs to the form (react-hook-form rules).
 */
export function Input({
  label,
  hint,
  error,
  required,
  optional,
  leftIcon,
  rightElement,
  prefix,
  suffix,
  size = 'md',
  className,
  containerClassName,
  id,
  ref,
  ...inputProps
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const invalid = Boolean(error)
  const { disabled, readOnly, type } = inputProps

  // Nothing to show around the box? The Field wrapper still stays in the React tree, so the
  // input is never re-created (and never loses focus) when an error appears later. It just
  // steps out of the layout (`contents`), and the box takes the container classes instead.
  const bare = !label && !optional && !isMessage(hint) && errorMessageOf(error) == null

  const hasPrefix = isMessage(prefix)
  const hasSuffix = isMessage(suffix)

  return (
    <Field
      label={label}
      htmlFor={inputId}
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
          readOnly && 'bg-surface-2',
          bare && containerClassName,
          className,
        )}
        onMouseDown={focusControlOnPress}
      >
        {leftIcon && (
          <span
            className={cn(
              ADORNMENT,
              'pl-3 text-fg-subtle transition-colors duration-200 [&_svg]:size-4',
              // The icon picks up the brand colour while the field is focused.
              !invalid && 'group-has-[[data-control]:focus]/field:text-brand-500',
            )}
          >
            {leftIcon}
          </span>
        )}
        {hasPrefix && (
          <span className={cn(ADORNMENT, 'text-fg-muted', leftIcon ? 'pl-2' : 'pl-3.5')}>{prefix}</span>
        )}

        <input
          ref={ref}
          id={inputId}
          data-control=""
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          {...inputProps}
          aria-describedby={describedByFor(inputId, { hint, error }, inputProps['aria-describedby'])}
          className={cn(
            fieldControl,
            'h-full',
            fieldPadding[size] ?? fieldPadding.md,
            (leftIcon || hasPrefix) && 'pl-2',
            (rightElement || hasSuffix) && 'pr-2',
            type === 'number' && 'tabular-nums',
          )}
        />

        {hasSuffix && (
          <span className={cn(ADORNMENT, 'text-fg-muted', rightElement ? 'pr-2' : 'pr-3.5')}>{suffix}</span>
        )}
        {/* A bare icon passed here is sized like the left icon; buttons and chips keep their own size. */}
        {rightElement && (
          <span className={cn(ADORNMENT, 'pr-1.5 [&>svg]:mr-1.5 [&>svg]:size-4 [&>svg]:text-fg-subtle')}>
            {rightElement}
          </span>
        )}
      </div>
    </Field>
  )
}
