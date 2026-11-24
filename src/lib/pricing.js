/**
 * Money maths for sales orders and purchase orders.
 * The UI uses these for the live totals preview; the backend must apply the
 * same rules when it saves an order (the demo data layer already does).
 */
import { roundMoney } from './format.js'

function positive(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

/**
 * Totals for a sales order.
 *   subtotal       = sum of unitPrice x quantity
 *   discountAmount = a fixed amount, or a percentage of the subtotal (never more than the subtotal)
 *   taxAmount      = taxRate % of (subtotal - discount)
 *   total          = subtotal - discount + tax + shipping
 */
export function calculateOrderTotals({
  items = [],
  discountType = 'amount',
  discountValue = 0,
  taxRate = 0,
  shippingFee = 0,
} = {}) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + positive(item.unitPrice) * positive(item.quantity), 0),
  )
  const rawDiscount =
    discountType === 'percent'
      ? (subtotal * Math.min(positive(discountValue), 100)) / 100
      : positive(discountValue)
  const discountAmount = roundMoney(Math.min(rawDiscount, subtotal))
  const taxableAmount = roundMoney(subtotal - discountAmount)
  const taxAmount = roundMoney((taxableAmount * positive(taxRate)) / 100)
  const shipping = roundMoney(positive(shippingFee))
  const total = roundMoney(taxableAmount + taxAmount + shipping)
  const itemsCount = items.reduce((sum, item) => sum + positive(item.quantity), 0)

  return { subtotal, discountAmount, taxableAmount, taxAmount, shippingFee: shipping, total, itemsCount }
}

/** Totals for a purchase order: subtotal = sum of unitCost x quantity, plus tax and shipping. */
export function calculatePurchaseTotals({ items = [], taxRate = 0, shippingFee = 0 } = {}) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + positive(item.unitCost) * positive(item.quantity), 0),
  )
  const taxAmount = roundMoney((subtotal * positive(taxRate)) / 100)
  const shipping = roundMoney(positive(shippingFee))
  const total = roundMoney(subtotal + taxAmount + shipping)
  const itemsCount = items.reduce((sum, item) => sum + positive(item.quantity), 0)

  return { subtotal, taxAmount, shippingFee: shipping, total, itemsCount }
}

/** Profit margin as a percentage of the selling price, or null when there is no price. */
export function calculateMargin(price, costPrice) {
  const sell = positive(price)
  if (sell === 0) return null
  return Math.round(((sell - positive(costPrice)) / sell) * 1000) / 10
}
