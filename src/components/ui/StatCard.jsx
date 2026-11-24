// StatCard: one headline figure (KPI) — label, icon tile, a big number that counts up,
// how it changed against the previous period and a small trend line.
// While `loading`, the changing parts are skeletons in rows of exactly the same height,
// so the page never jumps when the data arrives. Place StatCards in a grid.
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPercent } from '@/lib/format'
import { spring } from '@/lib/motion'
import { AnimatedNumber } from './AnimatedNumber.jsx'
import { Card } from './Card.jsx'
import { Skeleton } from './Skeleton.jsx'
import { Sparkline } from './Sparkline.jsx'

const TONES = {
  brand: { tile: 'bg-brand-soft text-brand-fg', glow: 'bg-brand-500' },
  success: { tile: 'bg-success-soft text-success-fg', glow: 'bg-success' },
  warning: { tile: 'bg-warning-soft text-warning-fg', glow: 'bg-warning' },
  danger: { tile: 'bg-danger-soft text-danger-fg', glow: 'bg-danger' },
  info: { tile: 'bg-info-soft text-info-fg', glow: 'bg-info' },
  neutral: { tile: 'bg-surface-3 text-fg-muted', glow: 'bg-fg-subtle' },
}

export function StatCard(props) {
  const {
    label,
    value,
    format,
    icon,
    tone = 'brand',
    change,
    changeLabel = 'vs previous period',
    invertChange = false,
    sparkline,
    hint,
    loading = false,
    to,
    className,
    ...rest
  } = props

  // `'change' in props` is true as soon as the prop is written on the card, even while its value is
  // still undefined because the data is loading. That is how the skeleton knows which rows the
  // finished card will have, and why both are exactly the same height.
  const hasSparkline = 'sparkline' in props
  const hasTrendRow = 'change' in props || hasSparkline
  const hasHintRow = 'hint' in props

  const toneStyle = TONES[tone] ?? TONES.brand
  // With `to` the whole card content is one link.
  const Body = to ? Link : 'div'

  return (
    <Card
      hover={Boolean(to)}
      aria-busy={loading || undefined}
      className={cn('relative flex flex-col overflow-hidden p-0', className)}
      {...rest}
    >
      {/* Decoration: a soft glow in the tone colour behind the icon tile. */}
      <span
        aria-hidden="true"
        className={cn('pointer-events-none absolute -right-10 -top-12 size-32 rounded-full opacity-15 blur-2xl', toneStyle.glow)}
      />

      {/* @container: the rows below adapt to the width of THIS card, not of the screen. */}
      <Body
        to={to}
        className={cn('@container relative flex flex-1 flex-col p-5', to && 'rounded-2xl -outline-offset-2')}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="truncate pt-0.5 text-[13px] font-medium text-fg-muted">{label}</p>
          {icon && (
            <span
              aria-hidden="true"
              className={cn('grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-[18px]', toneStyle.tile)}
            >
              {icon}
            </span>
          )}
        </div>

        <div className="mt-1 flex h-9 items-center">
          {loading ? (
            <Skeleton className="h-7 w-28 max-w-full" />
          ) : (
            <AnimatedNumber
              value={value}
              format={format}
              // The font size follows the card width (cqw = 1% of it): 20px on narrow cards up to 28px.
              className="block min-w-0 flex-1 truncate font-display text-[length:clamp(1.25rem,14cqw,1.75rem)] font-bold leading-9 tracking-tight text-fg"
            />
          )}
        </div>

        {hasTrendRow && (
          <div className="mt-3 flex h-8 items-center justify-between gap-3">
            {loading ? (
              <>
                <Skeleton className="h-6 w-16 rounded-full" />
                {hasSparkline && <Skeleton className="hidden h-7 w-20 @[10rem]:block" />}
              </>
            ) : (
              <>
                <div className="flex min-w-0 items-center gap-2">
                  {change != null && <ChangeChip change={change} invert={invertChange} />}
                  {change != null && changeLabel && (
                    // Next to a sparkline there is only room for the label on wider cards.
                    <span className={cn('truncate text-xs text-fg-subtle', hasSparkline && 'hidden @[18rem]:inline')}>
                      {changeLabel}
                    </span>
                  )}
                </div>
                {hasSparkline && (
                  <Sparkline data={sparkline} tone={tone} width={80} height={32} className="hidden @[10rem]:block" />
                )}
              </>
            )}
          </div>
        )}

        {hasHintRow && (
          <div className="mt-2 flex h-4 items-center">
            {loading && hint == null ? (
              <Skeleton className="h-3 w-32 max-w-full" />
            ) : (
              <p className="truncate text-xs leading-4 text-fg-subtle">{hint}</p>
            )}
          </div>
        )}
      </Body>
    </Card>
  )
}

/** "↗ 12.4%" pill. Green when the change is good news, red when it is bad, grey when nothing moved. */
function ChangeChip({ change, invert }) {
  const amount = Number(change)
  if (!Number.isFinite(amount)) return null

  const direction = amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat'
  // Normally "up" is good. `invert` flips that for figures where less is better (returns, costs).
  const isGood = (direction === 'up') !== invert
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus
  const size = Math.abs(amount)

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...spring.bouncy, delay: 0.35 }}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-0.5 rounded-full pl-1.5 pr-2 text-xs font-semibold tabular-nums',
        direction === 'flat' && 'bg-surface-3 text-fg-muted',
        direction !== 'flat' && (isGood ? 'bg-success-soft text-success-fg' : 'bg-danger-soft text-danger-fg'),
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      {/* The arrow is decoration for screen readers, so say the direction in words too. */}
      <span className="sr-only">{direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'No change'}</span>
      {formatPercent(size, { decimals: size >= 100 ? 0 : 1 })}
    </motion.span>
  )
}
