/**
 * Demo implementation of the shop API: catalogue, reviews, customer accounts, addresses,
 * checkout, order history and tracking. A real backend replaces all of this (see src/api/*.js).
 */
import { calculateOrderTotals } from '../../lib/pricing.js'
import { hashString, roundMoney } from '../../lib/format.js'
import { FREE_SHIPPING_FROM, SHIPPING_FEE, TAX_RATE } from '../../config/app.js'
import { getSession } from '../session.js'
import { commit, getDb, nextNumber } from './db.js'
import { conflict, invalid, isUnset, matchesSearch, newId, notFound, nowIso, paginate, respond, text, unauthorized, validator } from './helpers.js'
import { stockStatusOf } from './rules.js'

/* ---------- Catalogue enrichment ------------------------------------------ */

export const slugify = (value) => String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const REVIEW_TEXT = [
  ['Excellent quality', 'Exactly as described and arrived well packed. Would buy again.'],
  ['Great value for money', 'Does the job perfectly for the price. Delivery was quick too.'],
  ['Very happy', 'Solid build and looks even better in person.'],
  ['Good, with one small issue', 'Works well, though the packaging could be sturdier.'],
  ['Highly recommended', 'We ordered these for the whole office and everyone loves them.'],
  ['Does what it says', 'Simple, reliable and well finished.'],
  ['Better than expected', 'Feels premium. Customer support answered my question within an hour.'],
  ['Decent', 'Okay for daily use. Delivery took a day longer than promised.'],
]

const FEATURES = {
  'Electronics': ['1-year manufacturer warranty', 'Plug and play, no drivers needed', 'Tested before dispatch'],
  'Office Supplies': ['Bulk pricing for businesses', 'Smudge-free, office-grade quality', 'Ships the same day'],
  'Furniture': ['Easy home assembly with tools included', 'Load-tested for daily use', '2-year warranty on frame'],
  'Kitchen & Dining': ['Food-safe, BPA-free materials', 'Dishwasher safe', 'Gift-ready packaging'],
  'Personal Care': ['Dermatologically tested', 'Cruelty-free', 'Travel friendly'],
  'Tools & Hardware': ['Heavy-duty construction', 'Ergonomic, anti-slip grip', '1-year replacement warranty'],
  'Packaging': ['Recyclable materials', 'Bulk packs for small businesses', 'Tear-resistant'],
  'Sports & Fitness': ['Sweat-resistant materials', 'Suitable for home and gym', 'Free returns within 7 days'],
}

/** Sales per product (non-cancelled orders), used for "bestseller" and sorting. */
function salesMap(db) {
  const map = new Map()
  for (const order of db.orders) {
    if (order.status === 'cancelled') continue
    for (const item of order.items) map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity)
  }
  return map
}

function createCatalog(db) {
  const categoryById = new Map(db.categories.map((category) => [category.id, category]))
  const sold = salesMap(db)
  const bestsellers = new Set([...sold.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id))
  const latest = new Set([...db.products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((product) => product.id))

  const view = (product) => {
    const hash = hashString(product.id)
    const category = categoryById.get(product.categoryId)
    const onSale = hash % 10 < 3
    const soldCount = sold.get(product.id) ?? 0
    const reviewCount = Math.max(2, Math.round(soldCount / 3) + (hash % 7))
    const badges = []
    if (onSale) badges.push('sale')
    if (bestsellers.has(product.id)) badges.push('bestseller')
    if (latest.has(product.id) || hash % 11 === 0) badges.push('new')
    return {
      id: product.id,
      slug: slugify(product.name),
      sku: product.sku,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      compareAtPrice: onSale ? Math.round((product.price * (1.15 + (hash % 20) / 100)) / 10) * 10 - 1 : null,
      unit: product.unit,
      stock: product.stock,
      inStock: product.stock > 0,
      stockStatus: stockStatusOf(product.stock, product.reorderLevel),
      rating: Math.min(4.9, Math.round((3.8 + (hash % 12) / 10) * 10) / 10),
      reviewCount,
      soldCount,
      badges,
      category: category ? { id: category.id, name: category.name, slug: slugify(category.name), color: category.color } : null,
      createdAt: product.createdAt,
    }
  }
  return { view, categoryById }
}

const SORTS = {
  featured: (a, b) => b.soldCount * b.rating - a.soldCount * a.rating,
  bestselling: (a, b) => b.soldCount - a.soldCount,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
}

function reviewsFor(db, product) {
  const hash = hashString(product.id)
  const count = Math.min(6, Math.max(2, product.reviewCount))
  return Array.from({ length: count }, (_, index) => {
    const customer = db.customers[(hash + index * 7) % db.customers.length]
    const [title, body] = REVIEW_TEXT[(hash + index * 3) % REVIEW_TEXT.length]
    const rating = Math.max(3, Math.min(5, Math.round(product.rating + ((index % 3) - 1) * 0.6)))
    const daysAgo = 3 + ((hash >> index) % 120)
    return { id: `rev_${product.id}_${index}`, author: customer.name, rating, title, body, verified: index % 3 !== 2, createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString() }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const catalog = {
  categories: () =>
    respond(() => {
      const db = getDb()
      const { view } = createCatalog(db)
      const visible = db.products.filter((product) => product.status === 'active').map(view)
      return db.categories.map((category) => {
        const items = visible.filter((product) => product.category?.id === category.id)
        return {
          id: category.id,
          name: category.name,
          slug: slugify(category.name),
          description: category.description,
          color: category.color,
          productCount: items.length,
          imageUrl: items[0]?.imageUrl ?? null,
          startingPrice: items.length ? Math.min(...items.map((item) => item.price)) : 0,
        }
      })
    }),

  products: (params = {}) =>
    respond(() => {
      const db = getDb()
      const { view } = createCatalog(db)
      let rows = db.products.filter((product) => product.status === 'active').map(view)
      if (!isUnset(params.category)) rows = rows.filter((row) => row.category?.slug === params.category)
      if (!isUnset(params.minPrice)) rows = rows.filter((row) => row.price >= Number(params.minPrice))
      if (!isUnset(params.maxPrice)) rows = rows.filter((row) => row.price <= Number(params.maxPrice))
      if (params.inStock === true || params.inStock === 'true') rows = rows.filter((row) => row.inStock)
      if (params.onSale === true || params.onSale === 'true') rows = rows.filter((row) => row.compareAtPrice)
      if (!isUnset(params.minRating)) rows = rows.filter((row) => row.rating >= Number(params.minRating))
      if (!isUnset(params.badge)) rows = rows.filter((row) => row.badges.includes(params.badge))
      if (Array.isArray(params.ids)) rows = rows.filter((row) => params.ids.includes(row.id))
      rows = rows.filter((row) => matchesSearch(row, params.search, ['name', 'sku', 'category.name', 'description']))
      rows.sort(SORTS[params.sort] ?? SORTS.featured)
      const prices = rows.map((row) => row.price)
      const page = paginate(rows, params, 12)
      return { ...page, facets: { minPrice: prices.length ? Math.min(...prices) : 0, maxPrice: prices.length ? Math.max(...prices) : 0 } }
    }),

  product: (slug) =>
    respond(() => {
      const db = getDb()
      const { view } = createCatalog(db)
      const all = db.products.filter((product) => product.status === 'active').map(view)
      const product = all.find((item) => item.slug === slug || item.id === slug)
      if (!product) throw notFound('Product')
      const raw = db.products.find((item) => item.id === product.id)
      return {
        ...product,
        features: FEATURES[product.category?.name] ?? [],
        specs: [
          ['SKU', product.sku],
          ['Category', product.category?.name],
          ['Sold as', raw.unit],
          ['Barcode', raw.barcode],
          ['Ships from', 'Pune, Maharashtra'],
        ],
        reviews: reviewsFor(db, product),
        related: all.filter((item) => item.category?.id === product.category?.id && item.id !== product.id).slice(0, 8),
      }
    }),

  search: (query) =>
    respond(() => {
      const term = String(query ?? '').trim()
      if (term.length < 2) return { products: [], categories: [] }
      const db = getDb()
      const { view } = createCatalog(db)
      return {
        products: db.products.filter((product) => product.status === 'active').map(view).filter((row) => matchesSearch(row, term, ['name', 'sku', 'category.name'])).slice(0, 6),
        categories: db.categories.filter((category) => matchesSearch(category, term, ['name'])).map((category) => ({ name: category.name, slug: slugify(category.name) })),
      }
    }),
}

/* ---------- Accounts ------------------------------------------------------ */

const TOKEN = 'shop.'

function publicUser(customer) {
  const user = { ...customer }
  delete user.password
  return user
}

function currentCustomer(db) {
  const token = getSession()?.token
  if (!token?.startsWith(TOKEN)) throw unauthorized()
  const customer = db.customers.find((item) => item.id === token.slice(TOKEN.length))
  if (!customer) throw unauthorized()
  return customer
}

export const auth = {
  login: ({ email, password } = {}) =>
    respond(() => {
      const db = getDb()
      const customer = db.customers.find((item) => item.email.toLowerCase() === String(email ?? '').trim().toLowerCase())
      if (!customer || customer.password !== password) throw unauthorized('Incorrect email or password.')
      return { token: `${TOKEN}${customer.id}`, user: publicUser(customer) }
    }),

  register: ({ name, email, phone, password } = {}) =>
    respond(() => {
      const db = getDb()
      const check = validator()
      check.require('name', name, 'Name')
      check.require('email', email, 'Email')
      check.email('email', email)
      if (!password || password.length < 8) check.add('password', 'Use at least 8 characters.')
      check.done()
      const normalized = text(email).toLowerCase()
      if (db.customers.some((item) => item.email.toLowerCase() === normalized)) {
        throw conflict('An account with this email already exists. Try signing in.', { email: 'This email already has an account.' })
      }
      const now = nowIso()
      const customer = {
        id: newId('cus'),
        name: text(name),
        email: normalized,
        phone: text(phone),
        company: '',
        type: 'individual',
        address: { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' },
        addresses: [],
        notes: '',
        password,
        createdAt: now,
        updatedAt: now,
      }
      db.customers.unshift(customer)
      commit()
      return { token: `${TOKEN}${customer.id}`, user: publicUser(customer) }
    }),

  me: () => respond(() => publicUser(currentCustomer(getDb()))),

  updateProfile: (patch = {}) =>
    respond(() => {
      const db = getDb()
      const customer = currentCustomer(db)
      if ('name' in patch && !text(patch.name)) throw invalid('Enter your name.', { name: 'Enter your name.' })
      for (const field of ['name', 'phone']) if (field in patch) customer[field] = text(patch[field])
      customer.updatedAt = nowIso()
      commit()
      return publicUser(customer)
    }),

  changePassword: ({ currentPassword, newPassword } = {}) =>
    respond(() => {
      const db = getDb()
      const customer = currentCustomer(db)
      if (customer.password !== currentPassword) throw invalid('Your current password is not correct.', { currentPassword: 'This is not your current password.' })
      if (!newPassword || newPassword.length < 8) throw invalid('Use at least 8 characters.', { newPassword: 'Use at least 8 characters.' })
      customer.password = newPassword
      commit()
      return null
    }),

  saveAddress: (address = {}) =>
    respond(() => {
      const db = getDb()
      const customer = currentCustomer(db)
      const check = validator()
      for (const [field, label] of [['name', 'Name'], ['line1', 'Address'], ['city', 'City'], ['postalCode', 'PIN code']]) check.require(field, address[field], label)
      check.done()
      customer.addresses = customer.addresses ?? []
      const clean = {
        id: address.id || newId('adr'),
        label: text(address.label) || 'Home',
        name: text(address.name),
        phone: text(address.phone),
        line1: text(address.line1),
        line2: text(address.line2),
        city: text(address.city),
        state: text(address.state),
        postalCode: text(address.postalCode),
        country: text(address.country) || 'India',
        isDefault: Boolean(address.isDefault) || customer.addresses.length === 0,
      }
      if (clean.isDefault) customer.addresses.forEach((item) => (item.isDefault = false))
      const index = customer.addresses.findIndex((item) => item.id === clean.id)
      if (index >= 0) customer.addresses[index] = clean
      else customer.addresses.push(clean)
      if (clean.isDefault) customer.address = { line1: clean.line1, line2: clean.line2, city: clean.city, state: clean.state, postalCode: clean.postalCode, country: clean.country }
      commit()
      return publicUser(customer)
    }),

  removeAddress: (id) =>
    respond(() => {
      const db = getDb()
      const customer = currentCustomer(db)
      customer.addresses = (customer.addresses ?? []).filter((item) => item.id !== id)
      if (customer.addresses.length && !customer.addresses.some((item) => item.isDefault)) customer.addresses[0].isDefault = true
      commit()
      return publicUser(customer)
    }),
}

/* ---------- Orders -------------------------------------------------------- */

import { CAN_CANCEL as CANCELLABLE } from '../../lib/orderRules.js'

function orderView(order) {
  const db = getDb()
  return {
    ...order,
    items: order.items.map((item) => {
      const product = db.products.find((entry) => entry.id === item.productId)
      return { ...item, imageUrl: product?.imageUrl ?? null, slug: slugify(item.name) }
    }),
  }
}

export const orders = {
  quote: ({ items = [], couponCode } = {}) =>
    respond(() => {
      const db = getDb()
      const lines = items
        .map((line) => {
          const product = db.products.find((entry) => entry.id === line.productId)
          return product ? { unitPrice: product.price, quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)) } : null
        })
        .filter(Boolean)
      const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
      const code = text(couponCode).toUpperCase()
      if (code && code !== 'WELCOME10') throw invalid('This coupon code is not valid.', { couponCode: 'Try WELCOME10.' })
      return calculateOrderTotals({
        items: lines,
        discountType: code ? 'percent' : 'amount',
        discountValue: code ? 10 : 0,
        taxRate: TAX_RATE,
        shippingFee: subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FEE,
      })
    }),

  place: ({ items = [], address, paymentMethod = 'upi', couponCode, notes } = {}) =>
    respond(() => {
      const db = getDb()
      const customer = currentCustomer(db)
      if (!items.length) throw invalid('Your cart is empty.')
      if (!address?.line1) throw invalid('Choose a delivery address.', { address: 'Choose a delivery address.' })
      const lines = items.map((line) => {
        const product = db.products.find((entry) => entry.id === line.productId && entry.status === 'active')
        if (!product) throw invalid('One of the products is no longer available.')
        const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1))
        if (quantity > product.stock) throw invalid(`Only ${product.stock} of ${product.name} left in stock.`, { items: product.id })
        return { product, quantity }
      })
      const orderItems = lines.map(({ product, quantity }) => ({
        id: newId('itm'),
        productId: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        unitPrice: product.price,
        quantity,
        lineTotal: roundMoney(product.price * quantity),
      }))
      const code = text(couponCode).toUpperCase()
      const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)
      const discountType = code === 'WELCOME10' ? 'percent' : 'amount'
      const discountValue = code === 'WELCOME10' ? 10 : 0
      const shippingFee = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
      const totals = calculateOrderTotals({ items: orderItems, discountType, discountValue, taxRate: TAX_RATE, shippingFee })
      const now = nowIso()
      const paid = paymentMethod === 'upi' || paymentMethod === 'card'
      const orderNumber = `${db.settings.orderPrefix || 'SO-'}${nextNumber('order')}`
      const order = {
        id: newId('ord'),
        orderNumber,
        customerId: customer.id,
        items: orderItems,
        itemsCount: totals.itemsCount,
        subtotal: totals.subtotal,
        discountType,
        discountValue,
        discountAmount: totals.discountAmount,
        taxRate: TAX_RATE,
        taxAmount: totals.taxAmount,
        shippingFee: totals.shippingFee,
        total: totals.total,
        status: 'pending',
        paymentStatus: paid ? 'paid' : 'unpaid',
        paymentMethod,
        shippingAddress: { name: address.name, phone: address.phone, line1: address.line1, line2: address.line2, city: address.city, state: address.state, postalCode: address.postalCode, country: address.country || 'India' },
        carrier: '',
        trackingNumber: '',
        notes: text(notes),
        timeline: [
          { id: newId('evt'), type: 'created', status: 'pending', title: 'Order placed', note: 'Placed on the website', at: now, by: customer.name },
          ...(paid ? [{ id: newId('evt'), type: 'payment', title: 'Payment received', note: paymentMethod.toUpperCase(), at: now, by: customer.name }] : []),
        ],
        createdAt: now,
        updatedAt: now,
      }
      for (const { product, quantity } of lines) {
        product.stock -= quantity
        db.stockMovements.unshift({ id: newId('mov'), productId: product.id, type: 'out', quantity, delta: -quantity, balanceAfter: product.stock, reason: 'sale', reference: orderNumber, note: 'Online order', createdBy: 'Website', createdAt: now })
      }
      db.orders.push(order)
      commit()
      return orderView(order)
    }),

  mine: (params = {}) =>
    respond(() => {
      const db = getDb()
      const customer = currentCustomer(db)
      let rows = db.orders.filter((order) => order.customerId === customer.id)
      if (!isUnset(params.status)) rows = rows.filter((order) => order.status === params.status)
      rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(orderView)
      return paginate(rows, params, 10)
    }),

  get: (orderNumber) =>
    respond(() => {
      const db = getDb()
      const customer = currentCustomer(db)
      const order = db.orders.find((item) => item.orderNumber === orderNumber && item.customerId === customer.id)
      if (!order) throw notFound('Order')
      return orderView(order)
    }),

  /** Customers may cancel while the order is pending or processing. Stock goes back; paid orders are refunded. */
  cancel: (orderNumber, { reason, note } = {}) =>
    respond(() => {
      const db = getDb()
      const customer = currentCustomer(db)
      const order = db.orders.find((item) => item.orderNumber === orderNumber && item.customerId === customer.id)
      if (!order) throw notFound('Order')
      if (!CANCELLABLE.includes(order.status)) {
        throw invalid(order.status === 'cancelled' ? 'This order is already cancelled.' : 'This order has already shipped, so it can no longer be cancelled. You can return it after delivery.')
      }
      if (!text(reason)) throw invalid('Choose a reason for cancelling.', { reason: 'Choose a reason.' })
      const now = nowIso()
      for (const item of order.items) {
        const product = db.products.find((entry) => entry.id === item.productId)
        if (!product) continue
        product.stock += item.quantity
        db.stockMovements.unshift({ id: newId('mov'), productId: product.id, type: 'in', quantity: item.quantity, delta: item.quantity, balanceAfter: product.stock, reason: 'cancellation', reference: order.orderNumber, note: 'Cancelled by customer', createdBy: customer.name, createdAt: now })
      }
      order.status = 'cancelled'
      order.timeline.push({ id: newId('evt'), type: 'status', status: 'cancelled', title: 'Cancelled by you', note: [text(reason), text(note)].filter(Boolean).join(' · '), at: now, by: customer.name })
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded'
        order.timeline.push({ id: newId('evt'), type: 'payment', title: 'Refund started', note: 'The money goes back to your original payment method in 3–5 working days.', at: now, by: 'Sahyadri Store' })
      }
      order.updatedAt = now
      commit()
      return orderView(order)
    }),

  track: ({ orderNumber, email } = {}) =>
    respond(() => {
      const db = getDb()
      const order = db.orders.find((item) => item.orderNumber.toLowerCase() === text(orderNumber).toLowerCase())
      const customer = order && db.customers.find((item) => item.id === order.customerId)
      if (!order || customer?.email.toLowerCase() !== text(email).toLowerCase()) {
        throw notFound('Order')
      }
      return orderView(order)
    }),
}

/* ---------- Support -------------------------------------------------------- */

export const support = {
  subscribe: ({ email } = {}) =>
    respond(() => {
      const check = validator()
      check.require('email', email, 'Email')
      check.email('email', email)
      check.done()
      const db = getDb()
      if (!db.newsletter.includes(email)) db.newsletter.push(email)
      commit()
      return null
    }),

  contact: (message = {}) =>
    respond(() => {
      const check = validator()
      check.require('name', message.name, 'Name')
      check.require('email', message.email, 'Email')
      check.email('email', message.email)
      check.require('message', message.message, 'Message')
      check.done()
      const db = getDb()
      db.messages.push({ id: newId('msg'), ...message, createdAt: nowIso() })
      commit()
      return { ticket: `TKT-${String(db.messages.length + 1000)}` }
    }),
}
