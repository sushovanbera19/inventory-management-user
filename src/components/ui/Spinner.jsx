// Spinner: a small turning ring that says "working on it".
// It is drawn in the current text colour, so `className="text-current"` makes it match a button label.
import { cn } from '@/lib/cn'

const SIZES = {
  sm: 'size-4', // 16px
  md: 'size-5', // 20px
  lg: 'size-7', // 28px
}

export function Spinner({ size = 'md', className, ...rest }) {
  return (
    <span
      role="status"
      className={cn('inline-flex shrink-0 text-brand-500', SIZES[size] ?? SIZES.md, className)}
      {...rest}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="size-full animate-spin [animation-duration:0.7s]"
      >
        {/* Faint full ring (the track) with a bright quarter arc travelling around it. */}
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">Loading</span>
    </span>
  )
}
