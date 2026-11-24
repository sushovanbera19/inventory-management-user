// Skeleton: a grey placeholder with a moving sheen, shown where content is still loading.
// Size and shape come from `className` (e.g. "h-10 w-10 rounded-full"); the default is one line of text.
import { cn } from '@/lib/cn'

// Widths for <SkeletonText> lines, so a paragraph does not look like a stack of equal bars.
const LINE_WIDTHS = ['w-full', 'w-11/12', 'w-4/5', 'w-full', 'w-10/12']

export function Skeleton({ className, ...rest }) {
  // A <span> (shown as a block) so it is valid inside <p>, <td> and other text containers.
  return <span aria-hidden="true" className={cn('skeleton block h-4 w-full', className)} {...rest} />
}

/** A few lines of placeholder text; the last line is shorter, like the end of a paragraph. */
export function SkeletonText({ lines = 3, className, ...rest }) {
  return (
    <span aria-hidden="true" className={cn('block space-y-2.5', className)} {...rest}>
      {Array.from({ length: lines }, (_, index) => {
        const isLastOfMany = lines > 1 && index === lines - 1
        return (
          <Skeleton
            key={index}
            className={cn('h-3.5', isLastOfMany ? 'w-3/5' : LINE_WIDTHS[index % LINE_WIDTHS.length])}
          />
        )
      })}
    </span>
  )
}
