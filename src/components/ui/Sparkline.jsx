// Sparkline: a tiny trend line drawn with plain SVG (no chart library).
// The line draws itself from left to right, a soft gradient fades in underneath
// and a dot marks the latest value. Give it an array of numbers.
import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { ease, spring } from '@/lib/motion'

// The SVG paints with `currentColor`, so one text-colour class sets line, fill and dot.
const TONE_COLOR = {
  brand: 'text-brand-500',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  neutral: 'text-fg-subtle',
}

const round = (number) => Math.round(number * 100) / 100

/** Spread the values evenly across the box. Bigger values sit higher (a smaller y). */
function toPoints(values, width, height, inset) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min
  const innerWidth = width - inset * 2
  const innerHeight = height - inset * 2

  return values.map((value, index) => ({
    x: inset + (index / (values.length - 1)) * innerWidth,
    // Flat data (every value equal) becomes a straight line through the middle.
    y: span === 0 ? height / 2 : inset + (1 - (value - min) / span) * innerHeight,
  }))
}

/**
 * Joins the points with one smooth curve (a cubic Bézier per segment).
 * The direction of the curve at each point is a blend of the slopes on both sides, and it is
 * flat at every peak and valley, so the line never swings above or below the real data.
 */
function smoothPath(points) {
  // Slope of the straight line from each point to the next one.
  const slopes = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index]
    const to = points[index + 1]
    slopes.push((to.y - from.y) / (to.x - from.x))
  }

  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0]
    if (index === points.length - 1) return slopes[slopes.length - 1]
    const before = slopes[index - 1]
    const after = slopes[index]
    if (before * after <= 0) return 0 // a peak, a valley or a flat stretch
    return (2 * before * after) / (before + after)
  })

  let path = `M ${round(points[0].x)} ${round(points[0].y)}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index]
    const to = points[index + 1]
    const third = (to.x - from.x) / 3
    path +=
      ` C ${round(from.x + third)} ${round(from.y + tangents[index] * third)},` +
      ` ${round(to.x - third)} ${round(to.y - tangents[index + 1] * third)},` +
      ` ${round(to.x)} ${round(to.y)}`
  }
  return path
}

export function Sparkline({
  data,
  tone = 'brand',
  width = 120,
  height = 36,
  filled = true,
  strokeWidth = 2,
  className,
  ...rest
}) {
  const gradientId = useId()
  const values = (Array.isArray(data) ? data : []).map(Number).filter(Number.isFinite)
  const hasData = values.length > 0

  const dotRadius = strokeWidth / 2 + 1.5
  // Keep the round line ends and the end dot inside the box.
  const inset = dotRadius + 1

  // A single value still deserves a line: draw it flat from edge to edge.
  const points = hasData ? toPoints(values.length === 1 ? [values[0], values[0]] : values, width, height, inset) : []
  const linePath = hasData ? smoothPath(points) : ''
  const first = points[0]
  const last = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0 overflow-visible', hasData ? TONE_COLOR[tone] ?? TONE_COLOR.brand : 'text-fg-subtle', className)}
      {...rest}
    >
      {!hasData && (
        // Nothing to plot yet: a quiet dashed baseline keeps the space from looking broken.
        <line
          x1={inset}
          x2={width - inset}
          y1={height / 2}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeWidth={strokeWidth}
          strokeDasharray="1 6"
          strokeLinecap="round"
        />
      )}

      {hasData && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* `key` = the path itself: new data mounts fresh elements, so the line draws again. */}
          {filled && (
            <motion.path
              key={`area ${linePath}`}
              d={`${linePath} L ${round(last.x)} ${height} L ${round(first.x)} ${height} Z`}
              fill={`url(#${gradientId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: ease.out }}
            />
          )}
          <motion.path
            key={`line ${linePath}`}
            d={linePath}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: 0.9, ease: ease.out }, opacity: { duration: 0.15 } }}
          />
          <motion.circle
            key={`dot ${linePath}`}
            cx={round(last.x)}
            cy={round(last.y)}
            r={dotRadius}
            fill="currentColor"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.bouncy, delay: 0.7 }}
          />
        </>
      )}
    </svg>
  )
}
