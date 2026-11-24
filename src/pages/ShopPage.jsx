// Shop: all products or one category, with filters (price, rating, stock, deals), sorting and pages.
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, Grid2x2, LayoutGrid, List, PackageSearch, SlidersHorizontal, X } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from '@/components/store/ProductBits'
import { ProductListItem, ProductListItemSkeleton } from '@/components/store/ProductListItem'
import { StorePagination } from '@/components/store/StorePagination'
import { Button, Checkbox, Drawer, EmptyState, Input, Select, Stagger } from '@/components/ui'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useQueryState } from '@/hooks/useQueryState'
import { cn } from '@/lib/cn'
import { useCategories, useProducts } from '@/queries'

const DEFAULTS = { page: 1, pageSize: 12, search: '', sort: 'featured', minPrice: '', maxPrice: '', inStock: false, onSale: false, minRating: '', badge: '' }
const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'bestselling', label: 'Bestselling' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
]

const VIEWS = [
  { value: 'grid', label: 'Large grid', icon: Grid2x2 },
  { value: 'compact', label: 'Compact grid', icon: LayoutGrid },
  { value: 'list', label: 'List', icon: List },
]

const GRID = {
  grid: 'grid grid-cols-2 gap-5 md:grid-cols-3',
  compact: 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4',
  list: 'flex flex-col gap-4',
}

export default function ShopPage() {
  const { categorySlug } = useParams()
  const [query, setQuery] = useQueryState(DEFAULTS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { data: categories } = useCategories()
  const category = categories?.find((item) => item.slug === categorySlug)
  const { data, isLoading, isFetching } = useProducts({ ...query, category: categorySlug })
  const title = query.search ? `Results for “${query.search}”` : category?.name ?? (query.onSale ? 'Deals' : 'All products')
  usePageTitle(title)

  const [view, setView] = useLocalStorage('store.shop.view', 'grid')
  const resultsRef = useRef(null)
  const activeCount = [query.minPrice, query.maxPrice, query.inStock, query.onSale, query.minRating, query.badge].filter(Boolean).length
  const filters = <Filters query={query} setQuery={setQuery} categories={categories} categorySlug={categorySlug} />

  // Changing page (or page size) glides back to the top of the results.
  function goToPage(page, extra = {}) {
    setQuery({ page, ...extra })
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const chips = [
    query.search && { key: 'search', label: `“${query.search}”`, onRemove: () => setQuery({ search: '' }) },
    query.onSale && { key: 'sale', label: 'On sale', onRemove: () => setQuery({ onSale: false }) },
    query.badge && { key: 'badge', label: query.badge === 'bestseller' ? 'Bestsellers' : 'New', onRemove: () => setQuery({ badge: '' }) },
    query.inStock && { key: 'stock', label: 'In stock', onRemove: () => setQuery({ inStock: false }) },
    query.minRating && { key: 'rating', label: `${query.minRating}★ & up`, onRemove: () => setQuery({ minRating: '' }) },
    (query.minPrice || query.maxPrice) && { key: 'price', label: `₹${query.minPrice || 0} – ${query.maxPrice ? `₹${query.maxPrice}` : 'any'}`, onRemove: () => setQuery({ minPrice: '', maxPrice: '' }) },
  ].filter(Boolean)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 flex items-center gap-1 text-sm text-fg-subtle" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-fg">Home</Link><ChevronRight className="size-4" />
        <Link to="/shop" className="hover:text-fg">Shop</Link>
        {category && (<><ChevronRight className="size-4" /><span className="text-fg">{category.name}</span></>)}
      </nav>

      <motion.div
        key={categorySlug ?? 'all'}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="force-dark relative mb-10 overflow-hidden rounded-[2rem] bg-linear-to-br from-[#120f33] via-[#2a1a6b] to-[#5b21b6] p-8 text-white shadow-raised sm:p-12"
      >
        <div aria-hidden="true" className="absolute -right-16 -top-16 size-80 rounded-full bg-fuchsia-500/40 blur-3xl animate-blob" />
        <div aria-hidden="true" className="absolute inset-0 bg-dot-grid opacity-20" />
        {category?.imageUrl && (
          <motion.img initial={{ opacity: 0, rotate: 20, scale: 0.6 }} animate={{ opacity: 1, rotate: 8, scale: 1 }} transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.15 }} src={category.imageUrl} alt="" className="absolute -bottom-10 right-6 hidden w-56 animate-float rounded-3xl shadow-2xl sm:block lg:right-16 lg:w-64" />
        )}
        <p className="relative text-xs font-bold uppercase tracking-[0.25em] text-white/60">{category ? 'Category' : 'Shop'}</p>
        <h1 className="relative mt-2 max-w-xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="relative mt-3 max-w-lg text-white/70">{category?.description ?? 'Quality products for work and home, delivered across India.'}</p>
        <p className="relative mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur">{data ? `${data.meta.total} products` : 'Loading…'}</p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-24">{filters}</div></aside>

        <div ref={resultsRef} className="scroll-mt-28">
          {/* Toolbar: filters (phones), count, sort and view switcher. */}
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
            <Button variant="secondary" size="sm" className="lg:hidden" leftIcon={<SlidersHorizontal />} onClick={() => setFiltersOpen(true)}>
              Filters{activeCount ? ` (${activeCount})` : ''}
            </Button>
            <p className="hidden text-sm text-fg-muted sm:block">
              {data ? <><b className="text-fg tabular-nums">{data.meta.total}</b> products{data.meta.totalPages > 1 && <> · page <b className="text-fg tabular-nums">{data.meta.page}</b> of {data.meta.totalPages}</>}</> : 'Loading…'}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Select size="sm" aria-label="Sort" className="w-44" value={query.sort} onChange={(event) => setQuery({ sort: event.target.value })} options={SORTS} />
              <div role="radiogroup" aria-label="View" className="flex rounded-xl bg-surface-2 p-1">
                {VIEWS.map((item) => (
                  <button key={item.value} type="button" role="radio" aria-checked={view === item.value} aria-label={item.label} title={item.label} onClick={() => setView(item.value)} className={cn('relative grid size-8 place-items-center rounded-lg transition-colors', view === item.value ? 'text-brand-fg' : 'text-fg-subtle hover:text-fg')}>
                    {view === item.value && <motion.span layoutId="shop-view" transition={{ type: 'spring', stiffness: 500, damping: 35 }} className="absolute inset-0 rounded-lg bg-surface shadow-card" />}
                    <item.icon className="relative size-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {chips.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {chips.map((chip) => <Chip key={chip.key} label={chip.label} onRemove={chip.onRemove} />)}
                  <button type="button" onClick={() => setQuery(DEFAULTS)} className="text-xs font-semibold text-fg-muted underline-offset-2 hover:text-fg hover:underline">Clear all</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={cn('transition-opacity duration-300', isFetching && !isLoading && 'opacity-50')}>
            {isLoading ? (
              <div className={GRID[view]}>{Array.from({ length: 6 }, (_, index) => (view === 'list' ? <ProductListItemSkeleton key={index} /> : <ProductCardSkeleton key={index} />))}</div>
            ) : data.data.length ? (
              <Stagger key={`${view}-${JSON.stringify(query)}-${categorySlug}`} stagger={view === 'list' ? 0.06 : 0.04} className={GRID[view]}>
                {data.data.map((product) => (view === 'list' ? <ProductListItem key={product.id} product={product} /> : <ProductCard key={product.id} product={product} />))}
              </Stagger>
            ) : (
              <EmptyState icon={<PackageSearch />} title="No products found" description="Try fewer filters or a different search." action={<Button variant="secondary" onClick={() => setQuery(DEFAULTS)}>Clear filters</Button>} />
            )}
          </div>

          {data && data.meta.total > 0 && (
            <div className="mt-10">
              <StorePagination page={data.meta.page} pageSize={query.pageSize} total={data.meta.total} onPageChange={goToPage} onPageSizeChange={(pageSize) => goToPage(1, { pageSize })} />
            </div>
          )}
        </div>
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} side="left" size="sm" title="Filters" footer={<Button fullWidth onClick={() => setFiltersOpen(false)}>Show {data?.meta.total ?? ''} products</Button>}>
        {filters}
      </Drawer>
    </div>
  )
}

function Chip({ label, onRemove }) {
  return (
    <motion.button layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} type="button" onClick={onRemove} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-soft pl-3 pr-2 text-xs font-medium text-brand-fg">
      {label}<X className="size-3.5" />
    </motion.button>
  )
}

function Filters({ query, setQuery, categories, categorySlug }) {
  const [price, setPrice] = useState({ min: query.minPrice, max: query.maxPrice })
  return (
    <div className="space-y-7">
      <FilterGroup title="Category">
        <ul className="space-y-0.5">
          <li><Link to="/shop" className={cn('block rounded-lg px-3 py-2 text-sm hover:bg-surface-2', !categorySlug && 'bg-brand-soft font-semibold text-brand-fg')}>All products</Link></li>
          {(categories ?? []).map((category) => (
            <li key={category.slug}>
              <Link to={`/category/${category.slug}`} className={cn('flex justify-between rounded-lg px-3 py-2 text-sm hover:bg-surface-2', categorySlug === category.slug && 'bg-brand-soft font-semibold text-brand-fg')}>
                {category.name}<span className="text-xs text-fg-subtle">{category.productCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </FilterGroup>
      <FilterGroup title="Price">
        <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); setQuery({ minPrice: price.min, maxPrice: price.max }) }}>
          <Input size="sm" type="number" min={0} placeholder="Min" aria-label="Minimum price" value={price.min} onChange={(event) => setPrice((current) => ({ ...current, min: event.target.value }))} />
          <Input size="sm" type="number" min={0} placeholder="Max" aria-label="Maximum price" value={price.max} onChange={(event) => setPrice((current) => ({ ...current, max: event.target.value }))} />
          <Button size="sm" type="submit" variant="secondary">Go</Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[[0, 499], [500, 1999], [2000, 4999], [5000, '']].map(([min, max]) => (
            <button key={min} type="button" onClick={() => { setPrice({ min: String(min || ''), max: String(max) }); setQuery({ minPrice: min || '', maxPrice: max }) }} className="rounded-full border border-line px-2.5 py-1 text-xs hover:border-brand-500 hover:text-brand-fg">
              {max ? `₹${min}–₹${max}` : `₹${min}+`}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Customer rating">
        <div className="space-y-1">
          {['4.5', '4', ''].map((value) => (
            <button key={value || 'any'} type="button" onClick={() => setQuery({ minRating: value })} className={cn('block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2', query.minRating === value && 'bg-brand-soft font-semibold text-brand-fg')}>
              {value ? `${value}★ & up` : 'Any rating'}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Availability">
        <div className="space-y-3">
          <Checkbox label="In stock only" checked={query.inStock} onChange={(event) => setQuery({ inStock: event.target.checked })} />
          <Checkbox label="On sale" checked={query.onSale} onChange={(event) => setQuery({ onSale: event.target.checked })} />
        </div>
      </FilterGroup>
      <AnimatePresence>
        {(query.minPrice || query.maxPrice || query.minRating || query.inStock || query.onSale) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button variant="ghost" fullWidth onClick={() => { setPrice({ min: '', max: '' }); setQuery({ minPrice: '', maxPrice: '', minRating: '', inStock: false, onSale: false }) }}>Reset filters</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg-subtle">{title}</p>
      {children}
    </div>
  )
}
