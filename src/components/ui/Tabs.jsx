// Tabs: switch between sections of a page. The underline (or pill) glides to the chosen tab.
//   <Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: 'All', count: 48 }, …]} />
import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { spring } from '@/lib/motion'

const SIZES = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-10 px-3 text-sm',
}

export function Tabs({ value, onChange, items = [], variant = 'underline', size = 'md', fullWidth, className, 'aria-label': ariaLabel }) {
  const indicatorId = useId()
  const pills = variant === 'pills'

  function handleKeyDown(event, index) {
    const last = items.length - 1
    let next = null
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    if (next == null) return
    event.preventDefault()
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus()
    onChange?.(items[next].value)
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'no-scrollbar flex max-w-full overflow-x-auto',
        pills ? 'gap-1 rounded-xl bg-surface-2 p-1' : 'gap-1 border-b border-line',
        fullWidth && '[&>*]:flex-1',
        className,
      )}
    >
      {items.map((item, index) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange?.(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-200',
              '[&_svg]:size-4 [&_svg]:shrink-0',
              SIZES[size] ?? SIZES.md,
              pills ? 'rounded-lg' : 'rounded-t-lg',
              selected ? 'text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {selected && (
              <motion.span
                layoutId={`tab-indicator-${indicatorId}`}
                aria-hidden="true"
                transition={spring.snappy}
                className={
                  pills
                    ? 'absolute inset-0 rounded-lg bg-surface shadow-sm ring-1 ring-fg/5'
                    : 'absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-brand-500'
                }
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {item.icon}
              {item.label}
              {item.count != null && (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-colors',
                    selected ? 'bg-brand-soft text-brand-fg' : 'bg-surface-3 text-fg-muted',
                  )}
                >
                  {formatNumber(item.count)}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
