// Shop pagination: first / previous, numbered pages with a sliding highlight, next / last,
// "Showing 13–24 of 53" and a page-size picker.
import { useId } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { spring } from '@/lib/motion'

/** Page numbers to show, with '…' gaps: 1 … 4 5 6 … 12 */
function pageList(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value))
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((value) => pages.add(value))
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b)
  const result = []
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push(`gap-${value}`)
    result.push(value)
  })
  return result
}

function NavButton({ label, disabled, onClick, children }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-fg-muted shadow-card transition-colors hover:border-brand-500 hover:text-brand-fg disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </motion.button>
  )
}

export function StorePagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizes = [12, 24, 48] }) {
  const highlightId = useId()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  if (!total) return null

  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-line bg-surface p-5 shadow-card md:flex-row md:justify-between">
      <p className="text-sm text-fg-muted">
        Showing <b className="text-fg tabular-nums">{from}–{to}</b> of <b className="text-fg tabular-nums">{total}</b> products
      </p>

      <nav aria-label="Pages" className="flex items-center gap-1.5">
        <span className="hidden sm:inline-flex"><NavButton label="First page" disabled={page <= 1} onClick={() => onPageChange(1)}><ChevronsLeft className="size-4" /></NavButton></span>
        <NavButton label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="size-4" /></NavButton>
        <div className="flex items-center gap-1">
          {pageList(page, totalPages).map((item) =>
            typeof item === 'string' ? (
              <span key={item} className="w-6 text-center text-fg-subtle">…</span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                onClick={() => onPageChange(item)}
                className={cn('relative grid size-10 place-items-center rounded-xl text-sm font-semibold tabular-nums transition-colors', item === page ? 'text-white' : 'text-fg-muted hover:bg-surface-2 hover:text-fg')}
              >
                {item === page && <motion.span layoutId={`page-${highlightId}`} transition={spring.snappy} className="absolute inset-0 rounded-xl bg-gradient-brand shadow-glow-sm" />}
                <span className="relative">{item}</span>
              </button>
            ),
          )}
        </div>
        <NavButton label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight className="size-4" /></NavButton>
        <span className="hidden sm:inline-flex"><NavButton label="Last page" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}><ChevronsRight className="size-4" /></NavButton></span>
      </nav>

      {onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          Per page
          <span className="flex rounded-xl bg-surface-2 p-1">
            {pageSizes.map((size) => (
              <button key={size} type="button" aria-pressed={size === pageSize} onClick={() => onPageSizeChange(size)} className={cn('rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums transition-all', size === pageSize ? 'bg-surface text-fg shadow-card' : 'text-fg-muted hover:text-fg')}>
                {size}
              </button>
            ))}
          </span>
        </div>
      )}
    </div>
  )
}
