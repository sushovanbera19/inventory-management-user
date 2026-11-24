# Sahyadri Store — user website (customer shop)

The customer-facing shop of the Inventory & Order Management System. React 19 + Vite 8 (JSX), Tailwind CSS 4,
Motion animations, TanStack Query, React Router. Frontend only: it runs on demo data in the browser until your backend is connected.

This is a separate project from `../admin-panel` (the staff/admin app). Each has its own `package.json`,
packages and dev server.

## Run it

```bash
npm install
npm run dev        # http://localhost:5180
```

Demo customer: **ananya.sharma@example.com / demo1234** (the sign-in page has a "Use demo account" button).
Coupon code for testing: **WELCOME10** (10% off).

## Pages

| URL | Page |
|---|---|
| `/` | Home: animated hero, categories, today's deals with countdown, bestsellers, new arrivals, reviews |
| `/shop`, `/category/:slug` | Catalogue with filters (category, price, rating, stock, deals), sorting, search; large grid / compact grid / list views; numbered pagination with 12 / 24 / 48 per page |
| `/product/:slug` | Product page: zoom on hover, price & discount, stock, add to cart / buy now, specs, reviews, related |
| `/cart` | Cart with coupon, free-delivery meter and summary (a cart drawer is also available everywhere) |
| `/checkout` | 3-step checkout: address → payment → review (sign-in required) |
| `/order-success/:orderNumber` | Confirmation with a celebration |
| `/account` | Overview, order history, saved addresses, profile & password |
| `/account/orders/:orderNumber` | Order tracking with status steps and history, "buy again", **cancel order** (with reasons) while pending or processing |
| `/track-order` | Track any order with its number + email (no sign-in) |
| `/wishlist` | Saved products |
| `/login`, `/register`, `/forgot-password` | Customer accounts |
| `/about`, `/contact`, `/faq` | Information pages |

Light/dark theme toggle in the header; responsive from phones to desktops.

**Look & feel:** hero slider (auto-play, swipe, parallax), 3D-tilt product cards with glare, quick view, fly-to-cart animation,
drag carousels, marquees, bento category grid, count-up stats, scroll progress bar and back-to-top button.

**Product photos:** in demo mode every product uses the photos listed in `src/api/mock/productPhotos.js` (they alternate).
Change the links there, or add a SKU to `PRODUCT_PHOTOS` for a product-specific photo.

## Connecting your backend

1. Copy `.env.example` to `.env`, set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL`.
2. Restart `npm run dev`.

All shop endpoints (catalogue, customer auth, addresses, cart quote, orders, tracking, newsletter, contact) are
documented at the top of **`src/api/index.js`**. Orders use the same shape as the admin panel, so an order placed
in the shop appears in the admin panel once both talk to the same backend.

> In demo mode each app keeps its own sample data in its own browser storage, so an order placed in the shop
> does not show up in the admin panel until both are connected to your backend.
