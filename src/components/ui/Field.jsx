// Field: the label above a form control and the hint or error message below it.
// Input, Textarea and Select use it for you; use it directly to label any other control:
//   <Field label="Type" htmlFor="type" error={errors.type?.message}> ...control with id="type"... </Field>
import { cloneElement, isValidElement, useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ease } from '@/lib/motion'
import { describedByFor, errorMessageOf, fieldMessageIds, isMessage } from './fieldStyles.js'

// The message opens like a drawer: its height grows from zero while it fades in.
// Explicit objects (not variant names) so a parent <Stagger> can never trigger it.
const MESSAGE_MOTION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, ease: ease.out },
}

/**
 * When the child is the control the label points at (its `id` equals `htmlFor`), connect it
 * to the message below with aria-describedby and mark it invalid, unless the caller already
 * set those attributes. Input / Textarea / Select do this themselves on their inner control.
 */
function wireControl(children, controlId, describedBy, invalid) {
  if (!isValidElement(children) || children.props.id !== controlId) return children

  const extra = {}
  if (describedBy && children.props['aria-describedby'] == null) extra['aria-describedby'] = describedBy
  if (invalid && children.props['aria-invalid'] == null) extra['aria-invalid'] = true

  return Object.keys(extra).length > 0 ? cloneElement(children, extra) : children
}

/**
 * `htmlFor` is the id of the control. The messages get the ids `<htmlFor>-hint` and
 * `<htmlFor>-error`, which is what the control's aria-describedby refers to.
 * `error` replaces `hint` while it is set; pass `error={true}` to mark the field invalid
 * without showing a message.
 */
export function Field({ label, htmlFor, hint, error, required, optional, className, children, ...rest }) {
  const fallbackId = useId()
  const controlId = htmlFor ?? fallbackId
  const { hintId, errorId } = fieldMessageIds(controlId)

  const errorMessage = errorMessageOf(error)
  const showHint = errorMessage == null && isMessage(hint)
  const describedBy = describedByFor(controlId, { hint, error })

  // Without `htmlFor` there is no control to point at, so a <label> would be an empty promise.
  const LabelTag = htmlFor ? 'label' : 'span'

  return (
    <div className={cn('flex min-w-0 flex-col', className)} {...rest}>
      {(label || optional) && (
        <div className="flex items-baseline justify-between gap-3 pb-1.5">
          <LabelTag
            id={`${controlId}-label`}
            htmlFor={htmlFor}
            className="min-w-0 text-sm font-medium text-fg"
          >
            {label}
            {required && (
              <span aria-hidden="true" className="ml-0.5 text-danger">
                *
              </span>
            )}
          </LabelTag>
          {optional && <span className="shrink-0 text-xs text-fg-muted">Optional</span>}
        </div>
      )}

      {wireControl(children, controlId, describedBy, Boolean(error))}

      {/* initial={false}: a message that is already there when the form opens does not animate. */}
      <AnimatePresence initial={false}>
        {errorMessage != null && (
          <motion.div key="error" className="overflow-hidden" {...MESSAGE_MOTION}>
            <p id={errorId} role="alert" className="flex items-start gap-1.5 pt-1.5 text-xs text-danger-fg">
              <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span className="min-w-0">{errorMessage}</span>
            </p>
          </motion.div>
        )}
        {showHint && (
          <motion.div key="hint" className="overflow-hidden" {...MESSAGE_MOTION}>
            <p id={hintId} className="pt-1.5 text-xs text-fg-muted">
              {hint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
