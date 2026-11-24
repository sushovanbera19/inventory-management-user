// The logo: LogoMark (the box icon) and Logo (icon + product name).
import { useId } from 'react'
import { APP_NAME } from '@/config/app'
import { cn } from '@/lib/cn'

/** The Inventra mark: a stocked box on the brand gradient. */
export function LogoMark({ size = 32, className }) {
  const gradientId = useId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7063f7" />
          <stop offset="1" stopColor="#9a4df2" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path d="M16 6.5 24.5 11 16 15.5 7.5 11 16 6.5Z" fill="#fff" fillOpacity=".96" />
      <path d="M7.5 12.9 15.1 17v8.6L7.5 21.5v-8.6Z" fill="#fff" fillOpacity=".58" />
      <path d="M24.5 12.9 16.9 17v8.6l7.6-4.1v-8.6Z" fill="#fff" fillOpacity=".8" />
    </svg>
  )
}

/** Mark + product name. Pass showName={false} for the mark alone (collapsed sidebar). */
export function Logo({ size = 32, showName = true, className, nameClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showName && (
        <span className={cn('font-display text-lg font-bold tracking-tight text-fg', nameClassName)}>
          {APP_NAME}
        </span>
      )}
    </span>
  )
}
