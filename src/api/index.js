/**
 * The shop's only door to data. Pages call these through the hooks in src/queries.
 * Set VITE_USE_MOCK=false in .env to send every call to your backend instead of the demo data.
 *
 * REST endpoints your backend should provide for the shop (all JSON, Bearer token when signed in):
 *
 * Catalogue (public)
 *   GET  /store/categories                 -> [{ id, name, slug, description, color, productCount, imageUrl, startingPrice }]
 *   GET  /store/products                   ?page&pageSize&search&category(slug)&minPrice&maxPrice&inStock&onSale&minRating&badge
 *                                           &sort (featured|bestselling|newest|price-asc|price-desc|rating)
 *                                          -> { data: StoreProduct[], meta: { page, pageSize, total, totalPages }, facets: { minPrice, maxPrice } }
 *   GET  /store/products/:slug             -> StoreProduct + { features: string[], specs: [label, value][], reviews: Review[], related: StoreProduct[] }
 *   GET  /store/search?q=                  -> { products: StoreProduct[] (max 6), categories: [{ name, slug }] }
 *
 *   StoreProduct = { id, slug, sku, name, description, imageUrl, price, compareAtPrice|null, unit, stock, inStock, stockStatus,
 *                    rating, reviewCount, soldCount, badges: ('sale'|'bestseller'|'new')[], category: { id, name, slug, color }, createdAt }
 *   Review       = { id, author, rating, title, body, verified, createdAt }
 *
 * Customer account
 *   POST   /store/auth/login               { email, password }               -> { token, user }   401 when wrong
 *   POST   /store/auth/register            { name, email, phone, password }  -> { token, user }   409 when the email exists
 *   GET    /store/auth/me                  -> user (401 without a valid token)
 *   PATCH  /store/auth/me                  { name?, phone? }                 -> user
 *   POST   /store/auth/change-password     { currentPassword, newPassword }  -> 204
 *   POST   /store/addresses                Address (with id to update)       -> user
 *   DELETE /store/addresses/:id            -> user
 *   user = { id, name, email, phone, addresses: Address[], createdAt }
 *   Address = { id, label, name, phone, line1, line2, city, state, postalCode, country, isDefault }
 *
 * Checkout & orders
 *   POST /store/cart/quote                 { items: [{ productId, quantity }], couponCode? } -> { subtotal, discountAmount, taxAmount, shippingFee, total, itemsCount }
 *   POST /store/orders                     { items, address, paymentMethod, couponCode?, notes? } -> Order   (signed in; deducts stock)
 *   GET  /store/orders                     ?page&pageSize&status -> { data: Order[], meta }   (the signed-in customer's orders)
 *   GET  /store/orders/:orderNumber        -> Order
 *   POST /store/orders/:orderNumber/cancel { reason, note? } -> Order   only while 'pending' or 'processing' (422 otherwise);
 *                                          puts the stock back, a paid order becomes 'refunded', adds a timeline entry
 *   POST /store/orders/track               { orderNumber, email } -> Order   (no sign-in needed; 404 when they don't match)
 *   Order has the same shape as in the admin panel (src/api/orders.js there).
 *
 * Support
 *   POST /store/newsletter                 { email } -> 204
 *   POST /store/contact                    { name, email, subject, message } -> { ticket }
 */
import { http } from './client.js'
import { USE_MOCK } from './config.js'
import { auth, catalog, orders, support } from './mock/store.js'

export { ApiError, UNAUTHORIZED_EVENT } from './client.js'
export { API_BASE_URL, USE_MOCK } from './config.js'
export { clearSession, getSession, setSession } from './session.js'

export const catalogApi = {
  categories: () => (USE_MOCK ? catalog.categories() : http.get('/store/categories')),
  products: (params) => (USE_MOCK ? catalog.products(params) : http.get('/store/products', { params })),
  product: (slug) => (USE_MOCK ? catalog.product(slug) : http.get(`/store/products/${slug}`)),
  search: (query) => (USE_MOCK ? catalog.search(query) : http.get('/store/search', { params: { q: query } })),
}

export const authApi = {
  login: (data) => (USE_MOCK ? auth.login(data) : http.post('/store/auth/login', data)),
  register: (data) => (USE_MOCK ? auth.register(data) : http.post('/store/auth/register', data)),
  me: () => (USE_MOCK ? auth.me() : http.get('/store/auth/me')),
  updateProfile: (patch) => (USE_MOCK ? auth.updateProfile(patch) : http.patch('/store/auth/me', patch)),
  changePassword: (data) => (USE_MOCK ? auth.changePassword(data) : http.post('/store/auth/change-password', data)),
  saveAddress: (address) => (USE_MOCK ? auth.saveAddress(address) : http.post('/store/addresses', address)),
  removeAddress: (id) => (USE_MOCK ? auth.removeAddress(id) : http.delete(`/store/addresses/${id}`)),
}

export const ordersApi = {
  quote: (data) => (USE_MOCK ? orders.quote(data) : http.post('/store/cart/quote', data)),
  place: (data) => (USE_MOCK ? orders.place(data) : http.post('/store/orders', data)),
  mine: (params) => (USE_MOCK ? orders.mine(params) : http.get('/store/orders', { params })),
  get: (orderNumber) => (USE_MOCK ? orders.get(orderNumber) : http.get(`/store/orders/${orderNumber}`)),
  cancel: (orderNumber, data) => (USE_MOCK ? orders.cancel(orderNumber, data) : http.post(`/store/orders/${orderNumber}/cancel`, data)),
  track: (data) => (USE_MOCK ? orders.track(data) : http.post('/store/orders/track', data)),
}

export const supportApi = {
  subscribe: (data) => (USE_MOCK ? support.subscribe(data) : http.post('/store/newsletter', data)),
  contact: (data) => (USE_MOCK ? support.contact(data) : http.post('/store/contact', data)),
}
