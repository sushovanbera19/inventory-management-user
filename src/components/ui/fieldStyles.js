/**
 * Shared look and wiring for the text-like form controls: Input, Textarea and Select
 * (SearchInput and QuantityStepper reuse the same box).
 *
 * The visible box is a wrapper element, the "shell". The real <input> / <textarea> / <select>
 * sits inside it with no border or background of its own and carries a `data-control`
 * attribute, so the shell can react to its focus and disabled state with CSS alone
 * (`has-[[data-control]:focus]:…`). That is what lets icons, a prefix or a button live
 * inside the field while it still looks like one control.
 */

const SHELL_BASE = [
  'group/field relative flex w-full min-w-0 items-center overflow-hidden rounded-xl border text-fg shadow-xs',
  // White in the light theme, a touch lighter than the card behind it in the dark theme.
  'bg-[color-mix(in_oklab,var(--surface)_96%,white)]',
  // 16px on phones (iOS zooms the page when a focused field is smaller), 14px from tablets up.
  'text-base md:text-sm',
  'transition-[border-color,box-shadow,background-color] duration-200 ease-out',
  'has-[[data-control]:disabled]:cursor-not-allowed has-[[data-control]:disabled]:bg-surface-2',
  'has-[[data-control]:disabled]:opacity-50 has-[[data-control]:disabled]:shadow-none',
].join(' ')

const SHELL_NORMAL = [
  'border-line-strong',
  'has-[[data-control]:focus]:border-brand-500 has-[[data-control]:focus]:ring-4',
  'has-[[data-control]:focus]:ring-brand-500/15',
].join(' ')

const SHELL_HOVER = 'hover:border-fg-subtle/60'

const SHELL_INVALID = 'border-danger ring-4 ring-danger/15 has-[[data-control]:focus]:ring-danger/25'

/** Classes for the visible box of a field, for the state it is in. */
export function fieldShellClass({ invalid = false, disabled = false } = {}) {
  if (invalid) return `${SHELL_BASE} ${SHELL_INVALID}`
  // No hover feedback on a disabled field: it must not look clickable.
  return disabled ? `${SHELL_BASE} ${SHELL_NORMAL}` : `${SHELL_BASE} ${SHELL_NORMAL} ${SHELL_HOVER}`
}

/** Control heights shared with buttons: sm 32px, md 40px, lg 48px. */
export const fieldHeights = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
}

/** Side padding of the control inside the shell, per size. */
export const fieldPadding = {
  sm: 'px-2.5',
  md: 'px-3.5',
  lg: 'px-4',
}

/**
 * The real control inside the shell. Font, colour and text alignment are inherited from the
 * shell, so a class such as `font-mono` or `text-right` on the shell also styles the text.
 */
export const fieldControl = [
  'block w-full min-w-0 flex-1 appearance-none bg-transparent outline-hidden',
  '[text-align:inherit] [text-transform:inherit]',
  'placeholder:text-fg-subtle disabled:cursor-not-allowed',
  // Keep the browser's autofill from painting its own background and text colour over the theme.
  'autofill:[-webkit-text-fill-color:var(--fg)] autofill:[transition:background-color_99999s_ease-out]',
].join(' ')

/** True for something that can be shown as a message (text or an element), not just a yes/no flag. */
export function isMessage(value) {
  return value != null && value !== false && value !== true && value !== ''
}

/**
 * The message to show for an `error` prop, or null when there is none.
 * Accepts text, an element, or a whole react-hook-form error object (`errors.name`), so a
 * forgotten `?.message` shows the message instead of crashing the page.
 */
export function errorMessageOf(error) {
  if (!isMessage(error)) return null
  const isPlainObject = typeof error === 'object' && !Array.isArray(error) && !('$$typeof' in error)
  if (isPlainObject) return isMessage(error.message) ? error.message : null
  return error
}

/** The ids Field gives its hint and error text, derived from the id of the control. */
export function fieldMessageIds(controlId) {
  return { hintId: `${controlId}-hint`, errorId: `${controlId}-error` }
}

/**
 * Value for `aria-describedby` on a control: the message Field shows under it (the error
 * replaces the hint), plus any ids the caller passed in. Returns undefined when there is nothing.
 */
export function describedByFor(controlId, { hint, error } = {}, extra) {
  const { hintId, errorId } = fieldMessageIds(controlId)
  const ids = []
  if (errorMessageOf(error) != null) ids.push(errorId)
  else if (isMessage(hint)) ids.push(hintId)
  if (extra) ids.push(extra)
  return ids.length > 0 ? ids.join(' ') : undefined
}

/**
 * onMouseDown handler for a shell: pressing its padding, an icon or the prefix / suffix puts
 * the cursor in the control, as if the whole box were the text field.
 */
export function focusControlOnPress(event) {
  if (event.target.closest('input, textarea, select, button, a, label, [role="button"]')) return
  const control = event.currentTarget.querySelector('[data-control]')
  if (!control || control.disabled) return
  // Without this the browser would move focus to the page right after we focus the control.
  event.preventDefault()
  control.focus()
}
