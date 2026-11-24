// PageLoader: the centred logo with a soft pulse, shown while a page (or the session) is loading.
// Used as the <Suspense> fallback; `fullScreen` covers the whole window.
import { motion } from 'motion/react'
import { LogoMark } from '@/components/brand/Logo'
import { cn } from '@/lib/cn'

export function PageLoader({ label = 'Loading…', fullScreen = false, className, ...rest }) {
  return (
    <div
      role="status"
      className={cn(
        'grid w-full place-items-center',
        fullScreen ? 'app-backdrop fixed inset-0 z-50 bg-bg' : 'min-h-[55vh] py-16',
        className,
      )}
      {...rest}
    >
      {/* A short delay before fading in: a page that loads almost instantly never flashes the loader. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.12 }}
        className="flex flex-col items-center gap-5"
      >
        <span className="relative grid place-items-center">
          {/* Two rings ripple outwards from behind the logo, half a beat apart. */}
          <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-2xl bg-brand-500/35" />
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-pulse-ring rounded-2xl bg-brand-500/25 [animation-delay:0.9s]"
          />
          <LogoMark size={48} className="relative rounded-[14px] shadow-glow" />
        </span>
        {label && <p className="text-sm font-medium text-fg-muted">{label}</p>}
      </motion.div>
    </div>
  )
}
