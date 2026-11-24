/**
 * Domain vocabulary shared by the data layer and the UI: every status, its
 * label, its colour tone and its icon are defined once, here.
 *
 * tone is one of: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
 * (the same names the <Badge tone="..."> component understands).
 */
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  Banknote,
  CircleCheck,
  CircleDashed,
  Clock,
  CreditCard,
  FilePen,
  Landmark,
  PackageCheck,
  PackageOpen,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Smartphone,
  Truck,
  Wallet,
} from 'lucide-react'

/* ---------- Sales orders -------------------------------------------------- */

export const ORDER_STATUS = {
  pending: { label: 'Pending', tone: 'warning', icon: Clock, description: 'Waiting to be confirmed' },
  processing: { label: 'Processing', tone: 'info', icon: PackageOpen, description: 'Being picked and packed' },
  shipped: { label: 'Shipped', tone: 'brand', icon: Truck, description: 'On the way to the customer' },
  delivered: { label: 'Delivered', tone: 'success', icon: PackageCheck, description: 'Received by the customer' },
  cancelled: { label: 'Cancelled', tone: 'danger', icon: Ban, description: 'Order was cancelled' },
}

/** The happy path, in order. */
export const ORDER_STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered']

/** Which statuses an order may move to from its current one. */
export const ORDER_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', tone: 'warning', icon: CircleDashed },
  paid: { label: 'Paid', tone: 'success', icon: CircleCheck },
  refunded: { label: 'Refunded', tone: 'neutral', icon: RotateCcw },
}

export const PAYMENT_METHODS = {
  upi: { label: 'UPI', icon: Smartphone },
  card: { label: 'Card', icon: CreditCard },
  bank_transfer: { label: 'Bank transfer', icon: Landmark },
  cash: { label: 'Cash', icon: Banknote },
  cod: { label: 'Cash on delivery', icon: Wallet },
}

/* ---------- Products & stock ---------------------------------------------- */

export const STOCK_STATUS = {
  in_stock: { label: 'In stock', tone: 'success' },
  low_stock: { label: 'Low stock', tone: 'warning' },
  out_of_stock: { label: 'Out of stock', tone: 'danger' },
}

/** One rule for the whole app: 0 = out, at or below the reorder level = low. */
export function getStockStatus(stock, reorderLevel = 0) {
  if (Number(stock) <= 0) return 'out_of_stock'
  if (Number(stock) <= Number(reorderLevel)) return 'low_stock'
  return 'in_stock'
}

export const PRODUCT_STATUS = {
  active: { label: 'Active', tone: 'success' },
  draft: { label: 'Draft', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

export const UNITS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'box', label: 'Boxes' },
  { value: 'pack', label: 'Packs' },
  { value: 'set', label: 'Sets' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'ltr', label: 'Litres' },
  { value: 'm', label: 'Metres' },
]

export const MOVEMENT_TYPES = {
  in: { label: 'Stock in', tone: 'success', icon: ArrowDownToLine, sign: '+' },
  out: { label: 'Stock out', tone: 'danger', icon: ArrowUpFromLine, sign: '−' },
  adjustment: { label: 'Adjustment', tone: 'info', icon: SlidersHorizontal, sign: '±' },
}

/** `types` lists the movement types each reason can be used with. */
export const MOVEMENT_REASONS = {
  purchase: { label: 'Purchase received', types: ['in'] },
  return: { label: 'Customer return', types: ['in'] },
  cancellation: { label: 'Order cancelled', types: ['in'] },
  initial: { label: 'Opening stock', types: ['in'] },
  sale: { label: 'Sale', types: ['out'] },
  damage: { label: 'Damaged or expired', types: ['out'] },
  transfer: { label: 'Warehouse transfer', types: ['in', 'out'] },
  correction: { label: 'Stock count correction', types: ['in', 'out', 'adjustment'] },
}

/* ---------- Purchase orders ----------------------------------------------- */

export const PO_STATUS = {
  draft: { label: 'Draft', tone: 'neutral', icon: FilePen },
  ordered: { label: 'Ordered', tone: 'info', icon: Send },
  partial: { label: 'Partly received', tone: 'warning', icon: PackageOpen },
  received: { label: 'Received', tone: 'success', icon: PackageCheck },
  cancelled: { label: 'Cancelled', tone: 'danger', icon: Ban },
}

export const PO_TRANSITIONS = {
  draft: ['ordered', 'cancelled'],
  ordered: ['cancelled'],
  partial: [],
  received: [],
  cancelled: [],
}

/* ---------- People -------------------------------------------------------- */

export const SUPPLIER_STATUS = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
}

export const CUSTOMER_TYPES = {
  individual: { label: 'Individual', tone: 'info' },
  business: { label: 'Business', tone: 'brand' },
}

export const USER_ROLES = {
  admin: { label: 'Administrator' },
  manager: { label: 'Manager' },
  staff: { label: 'Staff' },
}

/* ---------- Look & settings ----------------------------------------------- */

/** Colours a category can be tagged with. */
export const CATEGORY_COLORS = {
  indigo: { label: 'Indigo', hex: '#6366f1' },
  violet: { label: 'Violet', hex: '#8b5cf6' },
  sky: { label: 'Sky', hex: '#0ea5e9' },
  cyan: { label: 'Cyan', hex: '#06b6d4' },
  teal: { label: 'Teal', hex: '#14b8a6' },
  emerald: { label: 'Emerald', hex: '#10b981' },
  amber: { label: 'Amber', hex: '#f59e0b' },
  orange: { label: 'Orange', hex: '#f97316' },
  rose: { label: 'Rose', hex: '#f43f5e' },
  pink: { label: 'Pink', hex: '#ec4899' },
}

export function categoryHex(color) {
  return CATEGORY_COLORS[color]?.hex ?? CATEGORY_COLORS.indigo.hex
}

export const CURRENCIES = [
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'AED', label: 'UAE Dirham (AED)' },
  { value: 'SGD', label: 'Singapore Dollar (S$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
]

/** Time ranges offered on the dashboard and reports. */
export const DATE_RANGES = [
  { value: '7d', label: 'Last 7 days', short: '7D' },
  { value: '30d', label: 'Last 30 days', short: '30D' },
  { value: '90d', label: 'Last 90 days', short: '90D' },
  { value: '12m', label: 'Last 12 months', short: '12M' },
]

/* ---------- Helpers ------------------------------------------------------- */

/** Turn one of the maps above into <Select> options: [{ value, label }]. */
export function toOptions(map) {
  return Object.entries(map).map(([value, meta]) => ({ value, label: meta.label }))
}
