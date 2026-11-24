// ConfirmDialog: "Are you sure?" before something destructive or hard to undo.
// Pages normally use the promise-based useConfirm() hook instead of rendering this directly.
import { CircleAlert, CircleHelp, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button.jsx'
import { Modal } from './Modal.jsx'

const TONES = {
  danger: { icon: <TriangleAlert />, tile: 'bg-danger-soft text-danger-fg', button: 'danger' },
  warning: { icon: <CircleAlert />, tile: 'bg-warning-soft text-warning-fg', button: 'primary' },
  brand: { icon: <CircleHelp />, tile: 'bg-brand-soft text-brand-fg', button: 'primary' },
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading,
  icon,
  onConfirm,
  onCancel,
}) {
  const look = TONES[tone] ?? TONES.danger

  return (
    <Modal open={open} onClose={onCancel} size="sm" hideCloseButton>
      <div className="flex flex-col items-center pt-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
        <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl [&_svg]:size-6', look.tile)} aria-hidden="true">
          {icon ?? look.icon}
        </span>
        <div className="mt-3 min-w-0 sm:mt-1">
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          {description && <p className="mt-1.5 text-sm text-fg-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={look.button} onClick={onConfirm} loading={loading} data-autofocus>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
