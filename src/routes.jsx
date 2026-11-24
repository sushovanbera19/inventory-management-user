// Every page of the shop and its URL (pages load on demand).
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { StoreLayout } from '@/components/layout/StoreLayout'
import { PageLoader } from '@/components/ui'
import { useAuth } from '@/context/StoreContexts'

const HomePage = lazy(() => import('@/pages/HomePage.jsx'))
const ShopPage = lazy(() => import('@/pages/ShopPage.jsx'))
const ProductPage = lazy(() => import('@/pages/ProductPage.jsx'))
const CartPage = lazy(() => import('@/pages/CartPage.jsx'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage.jsx'))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage.jsx'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage.jsx'))
const TrackOrderPage = lazy(() => import('@/pages/TrackOrderPage.jsx'))
const AuthPage = lazy(() => import('@/pages/AuthPage.jsx'))
const AccountPage = lazy(() => import('@/pages/account/AccountPage.jsx'))
const OrderPage = lazy(() => import('@/pages/account/OrderPage.jsx'))
const AboutPage = lazy(() => import('@/pages/info/AboutPage.jsx'))
const ContactPage = lazy(() => import('@/pages/info/ContactPage.jsx'))
const FaqPage = lazy(() => import('@/pages/info/FaqPage.jsx'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'))

/** Pages that need a signed-in customer send guests to sign in first, then back. */
function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <PageLoader label="Loading your account…" />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export function StoreRoutes() {
  return (
    <Suspense fallback={<PageLoader fullScreen />}>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/category/:categorySlug" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/order-success/:orderNumber" element={<RequireAuth><OrderSuccessPage /></RequireAuth>} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="/account/orders/:orderNumber" element={<RequireAuth><OrderPage /></RequireAuth>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
