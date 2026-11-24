/**
 * Business rules the demo API shares with the UI's own copies in src/lib/constants.js.
 * (Kept here because src/api must not import lucide icons, which constants.js does.)
 */

export const ORDER_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export const PO_TRANSITIONS = {
  draft: ['ordered', 'cancelled'],
  ordered: ['cancelled'],
  partial: [],
  received: [],
  cancelled: [],
}

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const PO_STATUS_LABELS = {
  draft: 'Draft',
  ordered: 'Ordered',
  partial: 'Partly received',
  received: 'Received',
  cancelled: 'Cancelled',
}

export const PAYMENT_METHOD_LABELS = {
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  cod: 'Cash on delivery',
}

/** Which reasons fit each movement type. */
export const MOVEMENT_REASON_TYPES = {
  purchase: ['in'],
  return: ['in'],
  cancellation: ['in'],
  initial: ['in'],
  sale: ['out'],
  damage: ['out'],
  transfer: ['in', 'out'],
  correction: ['in', 'out', 'adjustment'],
}

/** 0 = out of stock, at or below the reorder level = low stock. */
export function stockStatusOf(stock, reorderLevel) {
  if (stock <= 0) return 'out_of_stock'
  if (stock <= reorderLevel) return 'low_stock'
  return 'in_stock'
}
