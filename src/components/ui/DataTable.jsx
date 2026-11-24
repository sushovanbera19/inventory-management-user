// DataTable: the table behind every list screen. It handles the four states of a list
// (loading skeleton, error, empty, data), sorting, row selection and clickable rows, and
// below 768px it becomes a list of cards when `renderMobileCard` is given.
//
// Good to know:
// - `renderMobileCard` returns only the CONTENT of a card. The padding, the divider, the tap
//   behaviour and the checkbox are added here.
// - It brings its own card surface. Inside <Card padding="none"> it sits flush instead.
// - Wide tables scroll sideways inside the component. The header row sticks to the top once the
//   table has a height limit, e.g. className="max-h-[32rem]".
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, ChevronsUpDown, RotateCw } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import { titleCase } from '@/lib/format'
import { ease, listItem, spring } from '@/lib/motion'
import { Checkbox } from './Checkbox.jsx'
import { EmptyState } from './EmptyState.jsx'
import { ErrorState } from './ErrorState.jsx'
import { Select } from './Select.jsx'
import { Skeleton } from './Skeleton.jsx'

/* ---------- Styles -------------------------------------------------------- */

const ROOT = [
  'relative flex min-w-0 flex-col overflow-clip rounded-2xl border border-line bg-surface shadow-card',
  // Inside <Card padding="none"> the card already is the surface: keep just a top hairline.
  // (-mt-px lays that line over the border of a CardHeader above, instead of doubling it.)
  'in-data-[card=flush]:-mt-px in-data-[card=flush]:rounded-none in-data-[card=flush]:border-x-0',
  'in-data-[card=flush]:border-b-0 in-data-[card=flush]:bg-transparent in-data-[card=flush]:shadow-none',
  // Inside a padded card: keep the outline, drop the second shadow.
  'in-data-[card=padded]:shadow-none',
].join(' ')

// The box that holds the table (or the cards). "Width 0, but at least 100%" makes it exactly as
// wide as its parent while reporting no width of its own, so a wide table can never push a grid
// or flex layout (and with it the whole page) wider: it scrolls inside this box instead.
const SCROLL_BOX = 'min-h-0 w-0 min-w-full flex-1'

const HEAD_CELL =
  'sticky top-0 z-10 whitespace-nowrap bg-surface-2 px-4 text-left align-middle text-xs font-medium uppercase tracking-wide text-fg-subtle first:pl-5 last:pr-5'

const BODY_CELL = 'border-t border-line px-4 align-middle text-fg first:pl-5 last:pr-5'

// A height on a table cell works as a minimum. Text, a two-line cell and a 40px thumbnail all
// fit in 56px, so real rows and skeleton rows are the same height and nothing jumps on load.
const DENSITY = {
  regular: { head: 'h-11', cell: 'h-14 py-2' },
  dense: { head: 'h-9', cell: 'h-11 py-1.5' },
}

const SELECT_CELL = 'w-12 pl-5 pr-0'

// A brand-coloured bar on the left edge marks a selected row (together with the tint and the tick).
const SELECTED_BAR = 'shadow-[inset_3px_0_0_var(--color-brand-500)]'

const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const HIDE_BELOW = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-3/5']

/* ---------- Row entrance --------------------------------------------------- */

// Table rows start slightly ABOVE their place. Starting below would stick out under the table
// for a moment, and the scroll area would flash a scrollbar.
const ROW_FROM = { opacity: 0, y: -6 }
const ROW_TO = { opacity: 1, y: 0 }
const MAX_STAGGERED = 12

/**
 * Rows arrive one after another; from the 12th on they arrive together, so a long page never
 * makes the user wait. A row that is already on screen keeps its place and does not animate
 * again: React re-uses it (same `key`), and motion only plays `initial -> animate` on mount.
 */
function entrance(index) {
  return { duration: 0.28, ease: ease.out, delay: Math.min(index, MAX_STAGGERED) * 0.03 }
}

/* ---------- Row interaction ------------------------------------------------ */

const CONTROLS =
  'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [role="menuitem"], [role="checkbox"], [role="switch"]'

/** True when a click inside a row was meant for something in it (a button, a link, a menu), not for the row. */
function isClickOnControl(event) {
  const row = event.currentTarget
  // Menus and dialogs opened from a row are drawn elsewhere in the page (a portal), yet React
  // still reports their clicks to the row. Those never count as a click on the row.
  if (!row.contains(event.target)) return true
  const control = event.target.closest(CONTROLS)
  if (control && control !== row) return true
  // Dragging across a row to select its text also ends in a click: leave the selection alone.
  const selected = window.getSelection()
  return Boolean(selected && !selected.isCollapsed && row.contains(selected.anchorNode))
}

/** Keyboard support for a focused row: Enter / Space open it, the arrow keys move to the next row. */
function handleRowKeyDown(event, activate) {
  // Only when the row itself has focus, not while typing in a field (or using a menu) inside it.
  if (event.target !== event.currentTarget) return

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault() // Space would scroll the page
    activate()
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const row = event.currentTarget
    const neighbour = event.key === 'ArrowDown' ? row.nextElementSibling : row.previousElementSibling
    if (neighbour instanceof HTMLElement) {
      event.preventDefault()
      neighbour.focus()
    }
  }
}

/** The props that make a row (or a mobile card) clickable and reachable with the keyboard. */
function rowActionProps(row, onRowClick) {
  if (!onRowClick) return null
  return {
    tabIndex: 0,
    onClick: (event) => {
      if (!isClickOnControl(event)) onRowClick(row)
    },
    onKeyDown: (event) => handleRowKeyDown(event, () => onRowClick(row)),
  }
}

/**
 * Click handler for the area around a row checkbox: the whole cell is the target, so a click
 * just beside the box still toggles it and never opens the row.
 */
function selectAreaClick(event, toggle) {
  event.stopPropagation()
  // A click on the checkbox itself already toggled it (its own onChange).
  if (!event.target.closest('input, label')) toggle()
}

const getRowId = (row) => row.id

const columnId = (column, index) => column.key ?? index

/* ---------- Component ------------------------------------------------------ */

export function DataTable({
  columns = [],
  data = [],
  rowKey = getRowId,
  loading = false,
  fetching = false,
  error = null,
  onRetry,
  emptyState,
  sort,
  onSortChange,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  renderMobileCard,
  skeletonRows = 6,
  dense = false,
  caption,
  className,
  ...rest
}) {
  // Matches Tailwind's `md` breakpoint. Only one layout is rendered at a time.
  const isWide = useMediaQuery('(min-width: 768px)')
  const showCards = Boolean(renderMobileCard) && !isWide

  const rows = Array.isArray(data) ? data : []
  const keys = rows.map((row, index) => rowKey(row, index) ?? index)

  /* Selection: `selectedIds` may also hold rows of other pages, so only touch this page's ids. */
  const selectedSet = new Set(selectedIds)
  const selectedCount = keys.filter((key) => selectedSet.has(key)).length
  const allSelected = keys.length > 0 && selectedCount === keys.length

  function toggleRow(key) {
    onSelectionChange?.(selectedSet.has(key) ? selectedIds.filter((id) => id !== key) : [...selectedIds, key])
  }

  function toggleAll() {
    const onThisPage = new Set(keys)
    const onOtherPages = selectedIds.filter((id) => !onThisPage.has(id))
    onSelectionChange?.(allSelected ? onOtherPages : [...onOtherPages, ...keys])
  }

  const selection = selectable
    ? {
        isSelected: (key) => selectedSet.has(key),
        count: selectedCount,
        all: allSelected,
        some: selectedCount > 0 && !allSelected,
        toggleRow,
        toggleAll,
      }
    : null

  /* Which of the four states to show. Old rows stay visible when only a background refresh failed. */
  const hasRows = rows.length > 0
  const view = loading ? 'loading' : hasRows ? 'data' : error ? 'error' : 'empty'

  const shared = { columns, rows, keys, loading, skeletonRows, sort, onSortChange, onRowClick, selection }

  return (
    <div aria-busy={loading || fetching || undefined} className={cn(ROOT, className)} {...rest}>
      <FetchingBar active={fetching && !loading} />

      {view === 'data' && error && <RefreshFailedNotice onRetry={onRetry} />}

      {view === 'error' && <ErrorState error={error} onRetry={onRetry} />}

      {view === 'empty' &&
        (emptyState ?? (
          <EmptyState size="sm" title="Nothing to show yet" description="When there is data, it will appear here." />
        ))}

      {(view === 'loading' || view === 'data') &&
        (showCards ? (
          <CardList {...shared} renderMobileCard={renderMobileCard} />
        ) : (
          <TableView {...shared} dense={dense} caption={caption} />
        ))}
    </div>
  )
}

/* ---------- Status strips --------------------------------------------------- */

/** Thin moving bar along the top edge while fresh data is fetched in the background. */
function FetchingBar({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden"
          initial={{ opacity: 0 }}
          // The short delay keeps the bar away when the answer comes back almost instantly.
          animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.12 } }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          <div className="h-full w-full animate-indeterminate rounded-full bg-brand-500" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Shown above rows that are still on screen from an earlier, successful load. */
function RefreshFailedNotice({ onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line bg-danger-soft px-5 py-2 text-[13px] text-danger-fg"
    >
      <span>Could not refresh. You are looking at the last loaded data.</span>
      {onRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          className="-mx-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 font-semibold underline-offset-2 hover:underline"
        >
          <RotateCw aria-hidden="true" className="size-3.5" />
          Try again
        </button>
      )}
    </div>
  )
}

/* ---------- Table layout ----------------------------------------------------- */

/**
 * Tells whether a sideways-scrolling element has more content hidden on its left (`start`)
 * or right (`end`) side, so the table can show a soft shade there.
 */
function useScrollEdges(scrollerRef) {
  const [edges, setEdges] = useState({ start: false, end: false })

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return undefined

    function measure() {
      const start = scroller.scrollLeft > 1
      const end = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1
      // Returning the same object tells React nothing changed, so scrolling does not re-render.
      setEdges((current) => (current.start === start && current.end === end ? current : { start, end }))
    }

    scroller.addEventListener('scroll', measure, { passive: true })
    // Fires once right away, then whenever the wrapper or the table inside changes size.
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild)

    return () => {
      scroller.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [scrollerRef])

  return edges
}

function TableView({ columns, rows, keys, loading, skeletonRows, dense, caption, sort, onSortChange, onRowClick, selection }) {
  const scrollerRef = useRef(null)
  const edges = useScrollEdges(scrollerRef)
  const canScroll = edges.start || edges.end
  const density = dense ? DENSITY.dense : DENSITY.regular

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollerRef}
        // When the table is wider than its box, keyboard users can focus the box and scroll it with the arrow keys.
        tabIndex={canScroll ? 0 : undefined}
        role={canScroll ? 'region' : undefined}
        aria-label={canScroll ? `${typeof caption === 'string' ? caption : 'Table'} (scrolls sideways)` : undefined}
        className={cn(SCROLL_BOX, 'overflow-x-auto focus-visible:-outline-offset-2')}
      >
        <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
          {caption && <caption className="sr-only">{caption}</caption>}

          <thead>
            <tr>
              {selection && (
                <th scope="col" className={cn(HEAD_CELL, density.head, SELECT_CELL)}>
                  <Checkbox
                    aria-label="Select all rows on this page"
                    checked={selection.all}
                    indeterminate={selection.some}
                    disabled={loading || rows.length === 0}
                    onChange={selection.toggleAll}
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <HeaderCell
                  key={columnId(column, index)}
                  column={column}
                  heightClass={density.head}
                  sort={sort}
                  onSortChange={loading ? undefined : onSortChange}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }, (_, rowIndex) => (
                  <tr key={rowIndex} aria-hidden="true">
                    {selection && (
                      <td className={cn(BODY_CELL, density.cell, SELECT_CELL)}>
                        <Skeleton className="size-[18px] rounded-md" />
                      </td>
                    )}
                    {columns.map((column, columnIndex) => (
                      <td
                        key={columnId(column, columnIndex)}
                        className={cn(BODY_CELL, density.cell, HIDE_BELOW[column.hideBelow])}
                      >
                        <Skeleton
                          className={cn(
                            'h-4 min-w-10 max-w-44',
                            SKELETON_WIDTHS[(rowIndex + columnIndex) % SKELETON_WIDTHS.length],
                            column.align === 'right' && 'ml-auto',
                            column.align === 'center' && 'mx-auto',
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, rowIndex) => {
                  const key = keys[rowIndex]
                  const isSelected = selection ? selection.isSelected(key) : false

                  return (
                    <motion.tr
                      key={key}
                      initial={ROW_FROM}
                      animate={ROW_TO}
                      transition={entrance(rowIndex)}
                      {...rowActionProps(row, onRowClick)}
                      className={cn(
                        'transition-colors duration-150',
                        isSelected ? 'bg-brand-soft/40 hover:bg-brand-soft/70' : 'hover:bg-surface-2/60',
                        // The ring is drawn inside the row, where the scroll box cannot clip it.
                        onRowClick && 'cursor-pointer focus-visible:bg-surface-2 focus-visible:-outline-offset-2',
                      )}
                    >
                      {selection && (
                        <td
                          className={cn(
                            BODY_CELL,
                            density.cell,
                            SELECT_CELL,
                            'cursor-pointer transition-shadow duration-150',
                            isSelected && SELECTED_BAR,
                          )}
                          onClick={(event) => selectAreaClick(event, () => selection.toggleRow(key))}
                        >
                          <Checkbox
                            aria-label="Select row"
                            checked={isSelected}
                            onChange={() => selection.toggleRow(key)}
                          />
                        </td>
                      )}
                      {columns.map((column, columnIndex) => (
                        <td
                          key={columnId(column, columnIndex)}
                          className={cn(
                            BODY_CELL,
                            density.cell,
                            ALIGN[column.align],
                            HIDE_BELOW[column.hideBelow],
                            column.className,
                          )}
                        >
                          {column.cell ? column.cell(row, rowIndex) : row[column.key]}
                        </td>
                      ))}
                    </motion.tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      <EdgeShade side="start" visible={edges.start} />
      <EdgeShade side="end" visible={edges.end} />
    </div>
  )
}

/** Soft shade over the side of the table that still has columns to scroll to. */
function EdgeShade({ side, visible }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 z-20 w-6 to-transparent transition-opacity duration-200',
        side === 'start' ? 'left-0 bg-linear-to-r from-overlay/25' : 'right-0 bg-linear-to-l from-overlay/25',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}

function HeaderCell({ column, heightClass, sort, onSortChange }) {
  const sortKey = column.sortKey ?? column.key
  const canSort = Boolean(column.sortable && onSortChange)
  // 'asc' | 'desc' when the table is sorted by this column, otherwise null.
  const direction = column.sortable && sort?.key === sortKey ? (sort.dir === 'desc' ? 'desc' : 'asc') : null

  let ariaSort
  if (column.sortable) ariaSort = direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        HEAD_CELL,
        heightClass,
        ALIGN[column.align],
        HIDE_BELOW[column.hideBelow],
        column.width,
        column.headerClassName,
      )}
    >
      {column.sortable ? (
        <button
          type="button"
          disabled={!canSort}
          // First click sorts ascending, the next one flips the direction.
          onClick={() => onSortChange({ key: sortKey, dir: direction === 'asc' ? 'desc' : 'asc' })}
          className={cn(
            // The negative margin lines the label up with the cells below despite the button's padding.
            '-mx-2 inline-flex h-8 items-center gap-1 rounded-lg px-2 uppercase tracking-wide transition-colors',
            'enabled:hover:bg-surface-3/70 enabled:hover:text-fg',
            column.align === 'right' && 'flex-row-reverse',
            direction && 'text-fg',
          )}
        >
          {column.header}
          <SortIndicator direction={direction} />
        </button>
      ) : (
        column.header
      )}
    </th>
  )
}

/** Sorted column: an arrow that pops in and flips over when the direction changes. Otherwise a faint hint. */
function SortIndicator({ direction }) {
  const rotate = direction === 'desc' ? 180 : 0

  return (
    <span aria-hidden="true" className="relative grid size-4 shrink-0 place-items-center">
      <AnimatePresence initial={false}>
        {direction ? (
          <motion.span
            key="sorted"
            className="absolute text-brand-500"
            initial={{ opacity: 0, scale: 0.4, rotate }}
            animate={{ opacity: 1, scale: 1, rotate }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={spring.snappy}
          >
            <ArrowUp className="size-3.5" strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span
            key="unsorted"
            className="absolute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <ChevronsUpDown className="size-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/* ---------- Card layout (phones) --------------------------------------------- */

function CardList({ columns, rows, keys, loading, skeletonRows, sort, onSortChange, onRowClick, selection, renderMobileCard }) {
  // There is no header row to tap on a phone, so sorting moves into a small dropdown.
  const sortChoices = onSortChange
    ? columns
        .filter((column) => column.sortable)
        .flatMap((column) => {
          const sortKey = column.sortKey ?? column.key
          const label = typeof column.header === 'string' ? column.header : titleCase(column.key)
          return [
            { value: `${sortKey}:asc`, label: `${label} ↑` },
            { value: `${sortKey}:desc`, label: `${label} ↓` },
          ]
        })
    : []
  const sortValue = sort?.key ? `${sort.key}:${sort.dir === 'desc' ? 'desc' : 'asc'}` : ''
  const hasToolbar = Boolean(selection) || sortChoices.length > 0

  function handleSortChange(event) {
    const value = event.target.value
    if (!value) return
    const cut = value.lastIndexOf(':')
    onSortChange({ key: value.slice(0, cut), dir: value.slice(cut + 1) })
  }

  return (
    <>
      {hasToolbar && (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line bg-surface-2/60 px-4 py-2">
          {selection ? (
            <Checkbox
              label={selection.count > 0 ? `${selection.count} selected` : 'Select all'}
              checked={selection.all}
              indeterminate={selection.some}
              disabled={loading || rows.length === 0}
              onChange={selection.toggleAll}
            />
          ) : (
            <span className="text-[13px] font-medium text-fg-muted">Sort by</span>
          )}
          {sortChoices.length > 0 && (
            <div className="w-40 max-w-[55%]">
              <Select
                size="sm"
                aria-label="Sort by"
                // Shown while the list is in an order that is not one of the choices.
                placeholder={selection ? 'Sort by…' : 'Default order'}
                options={sortChoices}
                value={sortChoices.some((choice) => choice.value === sortValue) ? sortValue : ''}
                disabled={loading}
                onChange={handleSortChange}
              />
            </div>
          )}
        </div>
      )}

      <ul role="list" className={cn(SCROLL_BOX, 'divide-y divide-line overflow-y-auto')}>
        {loading
          ? Array.from({ length: skeletonRows }, (_, index) => (
              <li key={index} aria-hidden="true" className="flex items-center gap-3 px-4 py-3.5">
                {selection && <Skeleton className="size-[18px] shrink-0 rounded-md" />}
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <span className="block min-w-0 flex-1 space-y-2">
                  <Skeleton className={cn('h-4', SKELETON_WIDTHS[index % SKELETON_WIDTHS.length])} />
                  <Skeleton className="h-3 w-2/5" />
                </span>
                <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
              </li>
            ))
          : rows.map((row, index) => {
              const key = keys[index]
              const isSelected = selection ? selection.isSelected(key) : false

              return (
                <motion.li
                  key={key}
                  initial={listItem.hidden}
                  animate={ROW_TO}
                  transition={entrance(index)}
                  {...rowActionProps(row, onRowClick)}
                  className={cn(
                    'flex gap-2 px-4 py-3.5 transition-[background-color,box-shadow] duration-150',
                    isSelected && ['bg-brand-soft/40', SELECTED_BAR],
                    onRowClick && 'cursor-pointer focus-visible:bg-surface-2 focus-visible:-outline-offset-2',
                    onRowClick && !isSelected && 'active:bg-surface-2',
                  )}
                >
                  {selection && (
                    // 40px square around the 18px box, pulled into the padding so the card content stays aligned.
                    <div
                      className="-my-2.5 -ml-2.5 grid size-10 shrink-0 cursor-pointer place-items-center"
                      onClick={(event) => selectAreaClick(event, () => selection.toggleRow(key))}
                    >
                      <Checkbox
                        aria-label="Select"
                        checked={isSelected}
                        onChange={() => selection.toggleRow(key)}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">{renderMobileCard(row, index)}</div>
                </motion.li>
              )
            })}
      </ul>
    </>
  )
}
