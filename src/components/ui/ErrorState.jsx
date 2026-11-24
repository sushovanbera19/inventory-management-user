// ErrorState: shown when loading something failed — what went wrong and a "Try again" button.
//   <ErrorState error={query.error} onRetry={query.refetch} />
import { useState } from 'react'
import { RotateCw, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button.jsx'
import { FadeIn } from './Motion.jsx'

const FALLBACK_MESSAGE = 'Please check your connection and try again.'

export function ErrorState({ title = 'Something went wrong', description, error, onRetry, className, ...rest }) {
  const [retrying, setRetrying] = useState(false)
  const message = description ?? error?.message ?? FALLBACK_MESSAGE

  // `onRetry` usually returns a promise (query.refetch): keep the button busy until it settles.
  async function handleRetry() {
    setRetrying(true)
    try {
      await onRetry()
    } catch {
      // A failed retry is not handled here: the caller passes the new error back in through `error`.
    } finally {
      setRetrying(false)
    }
  }

  return (
    <FadeIn
      role="alert"
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="mb-4 grid size-14 place-items-center rounded-2xl bg-danger-soft text-danger-fg ring-1 ring-inset ring-danger/20 [&_svg]:size-6"
      >
        <TriangleAlert />
      </span>

      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-balance text-fg-muted">{message}</p>

      {onRetry && (
        <Button
          variant="secondary"
          className="mt-5"
          leftIcon={<RotateCw />}
          loading={retrying}
          onClick={handleRetry}
        >
          Try again
        </Button>
      )}
    </FadeIn>
  )
}
