// ProgressBar: a bar that fills up to `value` out of `max`; the fill glides to its new size.
// `indeterminate` shows a looping bar for work of unknown length.
import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { clamp } from '@/lib/format'
import { ease } from '@/lib/motion'

const TONE_FILL = {
  brand: 'bg-gradient-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-fg-subtle',
}

const TRACK_HEIGHT = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  value = 0,
  max = 100,
  tone = 'brand',
  size = 'md',
  showLabel = false,
  label,
  indeterminate = false,
  className,
  ...rest
}) {
  const labelId = useId()
  const total = Number(max) > 0 ? Number(max) : 100
  const current = clamp(Number(value) || 0, 0, total)
  const percent = (current / total) * 100
  const fill = TONE_FILL[tone] ?? TONE_FILL.brand

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={indeterminate ? undefined : current}
      aria-valuetext={indeterminate ? undefined : `${Math.round(percent)}%`}
      aria-labelledby={label ? labelId : undefined}
      className={cn('w-full', className)}
      {...rest}
    >
      {(label || showLabel) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
          <span id={labelId} className="min-w-0 truncate font-medium text-fg-muted">
            {label}
          </span>
          {showLabel && !indeterminate && (
            <span className="shrink-0 font-semibold tabular-nums text-fg">{Math.round(percent)}%</span>
          )}
        </div>
      )}

      <div className={cn('relative overflow-hidden rounded-full bg-surface-3', TRACK_HEIGHT[size] ?? TRACK_HEIGHT.md)}>
        {indeterminate ? (
          <div className={cn('absolute inset-0 animate-indeterminate rounded-full', fill)} />
        ) : (
          // The fill is always full width and slides in from the left (a transform, which is cheap
          // to animate). The track's overflow-hidden hides the part that is still outside.
          <motion.div
            className={cn('absolute inset-0 rounded-full', fill)}
            initial={{ x: '-100%' }}
            animate={{ x: `${percent - 100}%` }}
            transition={{ duration: 0.7, ease: ease.out }}
          />
        )}
      </div>
    </div>
  )
}
