// Wishlist: saved products (kept in this browser), with "add all to cart".
import { Heart, ShoppingBag } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from '@/components/store/ProductBits'
import { Button, EmptyState, Stagger } from '@/components/ui'
import { useCart, useWishlist } from '@/context/StoreContexts'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useProducts } from '@/queries'

export default function WishlistPage() {
  usePageTitle('Wishlist')
  const wishlist = useWishlist()
  const cart = useCart()
  const { data, isLoading } = useProducts({ ids: wishlist.ids, pageSize: 100 })
  const products = wishlist.ids.length ? (data?.data ?? []) : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Wishlist</h1>
          <p className="mt-1 text-fg-muted">{wishlist.ids.length} saved {wishlist.ids.length === 1 ? 'item' : 'items'}</p>
        </div>
        {products.some((product) => product.inStock) && (
          <Button leftIcon={<ShoppingBag />} onClick={() => products.filter((product) => product.inStock).forEach((product, index) => cart.add(product, 1, { silent: index > 0 }))}>Add all to cart</Button>
        )}
      </div>
      {!wishlist.ids.length ? (
        <EmptyState icon={<Heart />} title="Nothing saved yet" description="Tap the heart on any product to save it for later." action={<Button to="/shop">Discover products</Button>} />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{wishlist.ids.map((id) => <ProductCardSkeleton key={id} />)}</div>
      ) : (
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</Stagger>
      )}
    </div>
  )
}
