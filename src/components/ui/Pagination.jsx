// Pagination: "Showing 1–10 of 48 results", an optional rows-per-page picker, and
// previous / next buttons with numbered pages. On phones the numbers shrink to "2 / 5".
// Renders nothing while there are no results.
import { useId } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Ellipsis } from 'lucide-react'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/config/app'
import { cn } from '@/lib/cn'
import { clamp, formatNumber } from '@/lib/format'
import { spring, tap } from '@/lib/motion'
import { Select } from './Select.jsx'

function range(from, to) {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
}

/**
 * Which page buttons to show: the first and last page, the current page with a neighbour on each
 * side, and "…" where pages are skipped. Long lists always produce 7 slots, so the buttons keep
 * their place while you page through.
 *   getPageItems(5, 20) -> [1, '…', 4, 5, 6, '…', 20]
 */
function getPageItems(current, totalPages) {
  if (totalPages <= 7) return range(1, totalPages)
  if (current <= 4) return [...range(1, 5), 'gap-after', totalPages]
  if (current >= totalPages - 3) return [1, 'gap-before', ...range(totalPages - 4, totalPages)]
  return [1, 'gap-before', current - 1, current, current + 1, 'gap-after', totalPages]
}

export function Pagination({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  total = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  itemLabel = 'results',
  className,
  ...rest
}) {
  const id = useId()

  const totalItems = Number(total) || 0
  if (totalItems <= 0) return null

  const size = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(totalItems / size))
  // A page beyond the end (the last row of the last page was just deleted) counts as the last page.
  const current = clamp(Number(page) || 1, 1, totalPages)
  const firstItem = (current - 1) * size + 1
  const lastItem = Math.min(current * size, totalItems)

  const hasSizePicker = Boolean(onPageSizeChange)
  // Keep the active size selectable even when it is not one of the standard options.
  const sizeChoices = pageSizeOptions.includes(size) ? pageSizeOptions : [...pageSizeOptions, size].sort((a, b) => a - b)

  function goTo(nextPage) {
    if (nextPage >= 1 && nextPage <= totalPages && nextPage !== current) onPageChange?.(nextPage)
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex w-full flex-wrap items-center gap-x-4 gap-y-3 text-[13px] text-fg-muted',
        // Dropped straight into <Card padding="none"> (no CardFooter around it) it adds its own footer spacing.
        '[[data-card=flush]>&]:border-t [[data-card=flush]>&]:border-line [[data-card=flush]>&]:px-5 [[data-card=flush]>&]:py-3.5',
        className,
      )}
      {...rest}
    >
      {/* mr-auto pushes everything after this text to the right edge. */}
      <p aria-live="polite" className="mr-auto tabular-nums">
        <span className="max-sm:hidden">Showing </span>
        <span className="font-medium text-fg">
          {formatNumber(firstItem)}–{formatNumber(lastItem)}
        </span>{' '}
        of <span className="font-medium text-fg">{formatNumber(totalItems)}</span> {itemLabel}
      </p>

      {hasSizePicker && (
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-size`} className="max-md:sr-only">
            Rows per page
          </label>
          <div className="w-[4.75rem]">
            <Select
              id={`${id}-size`}
              size="sm"
              value={size}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              options={sizeChoices.map((choice) => ({ value: choice, label: String(choice) }))}
            />
          </div>
        </div>
      )}

      {totalPages > 1 && (
        // On phones, with a size picker on the first line, the pager takes a line of its own
        // with the two arrows at the edges where thumbs reach them.
        <div className={cn('flex items-center gap-1', hasSizePicker && 'max-sm:w-full max-sm:justify-between')}>
          <ArrowButton label="Previous page" disabled={current <= 1} onClick={() => goTo(current - 1)}>
            <ChevronLeft />
          </ArrowButton>

          {/* layoutRoot: the highlight glides between the buttons but ignores the whole pager moving
              (for example when the table above gets shorter on the last page). */}
          <motion.ol layoutRoot className="flex items-center gap-1 max-sm:hidden">
            {getPageItems(current, totalPages).map((item) =>
              typeof item === 'number' ? (
                <li key={item}>
                  <PageButton
                    pageNumber={item}
                    isCurrent={item === current}
                    indicatorId={`${id}-current`}
                    onClick={() => goTo(item)}
                  />
                </li>
              ) : (
                <li key={item} aria-hidden="true" className="grid size-8 place-items-center text-fg-subtle">
                  <Ellipsis className="size-4" />
                </li>
              ),
            )}
          </motion.ol>

          <p className="px-2 font-medium tabular-nums text-fg sm:hidden">
            <span className="sr-only">Page </span>
            {current}
            <span aria-hidden="true" className="px-1 text-fg-subtle">
              /
            </span>
            <span className="sr-only"> of </span>
            {totalPages}
          </p>

          <ArrowButton label="Next page" disabled={current >= totalPages} onClick={() => goTo(current + 1)}>
            <ChevronRight />
          </ArrowButton>
        </div>
      )}
    </nav>
  )
}

function ArrowButton({ label, disabled, onClick, children }) {
  return (
    <motion.button
      type="button"
      {...tap}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      // 40px on phones (thumbs), 32px from sm up (mouse).
      className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-fg-muted transition-colors enabled:hover:border-line-strong enabled:hover:bg-surface-2 enabled:hover:text-fg disabled:opacity-50 sm:size-8 [&_svg]:size-4"
    >
      {children}
    </motion.button>
  )
}

function PageButton({ pageNumber, isCurrent, indicatorId, onClick }) {
  return (
    <motion.button
      type="button"
      {...tap}
      aria-label={`Page ${pageNumber}`}
      aria-current={isCurrent ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'relative grid h-8 min-w-8 place-items-center rounded-lg px-2 font-medium tabular-nums transition-colors',
        isCurrent ? 'text-brand-fg' : 'hover:bg-surface-3/70 hover:text-fg',
      )}
    >
      {/* One highlight shared by all page buttons (same layoutId): it glides to the new page. */}
      {isCurrent && (
        <motion.span
          layoutId={indicatorId}
          transition={spring.snappy}
          className="absolute inset-0 rounded-lg bg-brand-soft ring-1 ring-inset ring-brand-500/20"
        />
      )}
      <span className="relative">{pageNumber}</span>
    </motion.button>
  )
}
