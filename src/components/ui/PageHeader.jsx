// PageHeader: the block at the top of every page — breadcrumbs or a back link, the title
// (with an optional badge), a description and the page's main actions.
// It also sets the browser tab title, so pages do not have to call usePageTitle themselves.
import { Link } from 'react-router'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/cn'
import { FadeIn } from './Motion.jsx'

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  backTo,
  backLabel = 'Back',
  badge,
  documentTitle,
  className,
  ...rest
}) {
  // `title` may be a node (e.g. with an icon); only plain text can go into the tab title.
  usePageTitle(documentTitle ?? (typeof title === 'string' ? title : undefined))

  const hasBreadcrumbs = Array.isArray(breadcrumbs) && breadcrumbs.length > 0

  return (
    <FadeIn
      as="header"
      y={8}
      // flex-wrap + basis-72: the actions sit on the right while there is room and drop below the title when there is not.
      className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}
      {...rest}
    >
      <div className="min-w-0 flex-1 basis-72">
        {hasBreadcrumbs && <Breadcrumbs items={breadcrumbs} />}

        {backTo && (
          // 40px tall for thumbs; the negative margins keep the text where a plain link would be.
          <Link
            to={backTo}
            className="group -ml-2.5 -mt-2.5 mb-0.5 inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-medium text-fg-muted transition-colors hover:bg-surface-3/70 hover:text-fg"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            {backLabel}
          </Link>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="min-w-0 text-2xl font-bold text-fg wrap-anywhere sm:text-[28px] sm:leading-9">{title}</h1>
          {badge}
        </div>

        {description && <p className="mt-1.5 max-w-2xl text-fg-muted">{description}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </FadeIn>
  )
}

/** "Products / Wireless mouse" trail. A crumb with `to` is a link; the last one is the current page. */
function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[13px]">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${index}-${crumb.to ?? ''}`} className="flex min-w-0 items-center gap-1">
              {index > 0 && <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-fg-subtle" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  aria-current={isLast ? 'page' : undefined}
                  // The invisible ::after makes the tap area 40px tall without moving the text.
                  className="relative rounded-md py-1 font-medium text-fg-muted transition-colors after:absolute after:-inset-x-1 after:-inset-y-2 hover:text-fg"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn('truncate py-1', isLast ? 'font-medium text-fg' : 'text-fg-muted')}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
