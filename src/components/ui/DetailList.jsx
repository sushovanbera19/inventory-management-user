// DetailList: label / value pairs for detail screens ("Payment method — UPI").
//   columns={1}  rows: label on the left, value on the right, hairline between rows
//   columns={2+} grid: label above its value (collapses to fewer columns on small screens)
import { createContext, use } from 'react'
import { cn } from '@/lib/cn'

// DetailList tells its rows which of the two layouts to use, so rows need no extra props.
const DetailLayoutContext = createContext('rows')

const GRID_COLUMNS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
}

export function DetailList({ columns = 1, className, children, ...rest }) {
  const layout = columns > 1 ? 'grid' : 'rows'

  return (
    <DetailLayoutContext value={layout}>
      <dl
        className={cn(
          layout === 'grid'
            ? ['grid gap-x-6 gap-y-5', GRID_COLUMNS[columns] ?? GRID_COLUMNS[2]]
            : 'divide-y divide-line',
          className,
        )}
        {...rest}
      >
        {children}
      </dl>
    </DetailLayoutContext>
  )
}

export function DetailRow({ label, icon, className, children, ...rest }) {
  const layout = use(DetailLayoutContext)
  const isGrid = layout === 'grid'

  return (
    <div
      className={cn(
        'min-w-0',
        isGrid ? 'flex flex-col gap-1' : 'flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0',
        className,
      )}
      {...rest}
    >
      <dt
        className={cn(
          'flex items-center gap-2 text-fg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-subtle',
          // In a row the label keeps its width (up to 60%) and the value takes whatever is left.
          isGrid ? 'text-[13px]' : 'max-w-[60%] shrink-0',
        )}
      >
        {icon}
        {label}
      </dt>
      {/* wrap-anywhere: long e-mails and tracking numbers break instead of pushing the layout wider. */}
      <dd className={cn('min-w-0 font-medium text-fg wrap-anywhere', !isGrid && 'text-right')}>{children}</dd>
    </div>
  )
}
