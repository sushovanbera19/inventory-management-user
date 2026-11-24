/** Shop-wide constants. Rename the store here and it changes everywhere. */

export const APP_NAME = 'Sahyadri Store'
export const APP_TAGLINE = 'Everything for work and home'

export const STORAGE_KEYS = {
  theme: 'store.theme',
  session: 'store.session',
  cart: 'store.cart',
  wishlist: 'store.wishlist',
  recent: 'store.recently-viewed',
  mockDb: 'store.mock-db.v2',
}

/** Demo customer for the in-browser demo data (VITE_USE_MOCK=true). Your backend decides real accounts. */
export const DEMO_CREDENTIALS = {
  email: 'ananya.sharma@example.com',
  password: 'demo1234',
}

/** Shipping rules shown in the cart and checkout (the backend should apply the same). */
export const FREE_SHIPPING_FROM = 1999
export const SHIPPING_FEE = 99
export const TAX_RATE = 18

export const SUPPORT = {
  email: 'help@sahyadri-store.example.com',
  phone: '+91 55500 04321',
  hours: 'Mon–Sat, 9 AM – 7 PM',
  address: '14, Riverside Business Park, Baner, Pune 411045',
}

export const DEFAULT_PAGE_SIZE = 12
export const PAGE_SIZE_OPTIONS = [12, 24, 48]
