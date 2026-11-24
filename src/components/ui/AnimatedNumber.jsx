// AnimatedNumber: a number that counts to its new value instead of jumping (KPIs, totals).
// The digits are written straight into the page on every animation frame, so React does
// not re-render 60 times a second while the number is moving.
import { useEffect, useLayoutEffect, useRef } from 'react'
import { animate, useMotionValue, useMotionValueEvent, useReducedMotionConfig } from 'motion/react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { ease } from '@/lib/motion'

const formatWholeNumber = (number) => formatNumber(Math.round(number))

export function AnimatedNumber({ value, format = formatWholeNumber, duration = 0.9, className, ...rest }) {
  const numeric = Number(value)
  const target = Number.isFinite(numeric) ? numeric : 0

  // True when the user (or the app's "reduce motion" setting) asked for less animation.
  const reduceMotion = useReducedMotionConfig()
  const textRef = useRef(null)

  // A motion value is a number that can change without re-rendering React.
  // It starts at 0 so the first appearance counts up (or at the target when motion is reduced).
  const count = useMotionValue(reduceMotion ? target : 0)

  // On the way to a whole number show whole numbers only, so no decimals flicker past.
  const toText = (number) => format(Number.isInteger(target) ? Math.round(number) : number)

  // Every animation frame: write the new text into the <span>.
  useMotionValueEvent(count, 'change', (latest) => {
    if (textRef.current) textRef.current.textContent = toText(latest)
  })

  // After every render, before the browser paints: show where the number currently is.
  // (Covers the first paint and a changed `format`, for example another currency.)
  useLayoutEffect(() => {
    textRef.current.textContent = toText(count.get())
  })

  // When the target changes, glide from wherever the number is right now to the new value.
  useEffect(() => {
    if (reduceMotion) {
      count.jump(target)
      return undefined
    }
    const controls = animate(count, target, { duration, ease: ease.out })
    return () => controls.stop()
  }, [count, target, duration, reduceMotion])

  return <span ref={textRef} className={cn('tabular-nums', className)} {...rest} />
}
