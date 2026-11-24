/**
 * Pure formatting helpers (no React). Components normally reach these through
 * the useFormatters() hook, which fills in the currency chosen in Settings.
 */
import { format as formatWithPattern, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'

const EMPTY = '—'

const CURRENCY_LOCALES = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  AED: 'en-AE',
  SGD: 'en-SG',
  AUD: 'en-AU',
  CAD: 'en-CA',
  JPY: 'ja-JP',
}

export function localeForCurrency(currency = 'INR') {
  return CURRENCY_LOCALES[currency] ?? 'en-US'
}

const formatterCache = new Map()

function numberFormatter(locale, options) {
  const key = `${locale}|${JSON.stringify(options)}`
  if (!formatterCache.has(key)) formatterCache.set(key, new Intl.NumberFormat(locale, options))
  return formatterCache.get(key)
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

/**
 * formatCurrency(1499)                      -> "₹1,499"
 * formatCurrency(1499.5)                    -> "₹1,499.50"
 * formatCurrency(1499, { decimals: 2 })     -> "₹1,499.00"
 * formatCurrency(1250000, { compact: true }) -> "₹12.5L"
 */
export function formatCurrency(value, { currency = 'INR', compact = false, decimals } = {}) {
  const amount = toNumber(value)
  const locale = localeForCurrency(currency)
  if (compact) {
    return numberFormatter(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  }
  const fractionDigits = decimals ?? (Number.isInteger(amount) ? 0 : 2)
  return numberFormatter(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount)
}

/** formatNumber(12500) -> "12,500" · formatNumber(12500, { compact: true }) -> "12.5K" */
export function formatNumber(value, { decimals = 0, compact = false, locale = 'en-IN' } = {}) {
  const number = toNumber(value)
  if (compact) {
    return numberFormatter(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(number)
  }
  return numberFormatter(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)
}

/** formatPercent(12.345) -> "12.3%" · formatPercent(12.345, { sign: true }) -> "+12.3%" */
export function formatPercent(value, { decimals = 1, sign = false } = {}) {
  const number = toNumber(value)
  const text = `${Math.abs(number).toFixed(decimals)}%`
  if (number < 0) return `-${text}`
  return sign && number > 0 ? `+${text}` : text
}

/** Accepts a Date, an ISO string or a timestamp. Returns null when it is not a real date. */
export function toDate(value) {
  if (value == null || value === '') return null
  const date = value instanceof Date ? value : typeof value === 'string' ? parseISO(value) : new Date(value)
  return isValid(date) ? date : null
}

/** formatDate('2026-11-14T09:30:00Z') -> "14 Nov 2026" */
export function formatDate(value, pattern = 'd MMM yyyy') {
  const date = toDate(value)
  return date ? formatWithPattern(date, pattern) : EMPTY
}

/** formatDateTime(...) -> "14 Nov 2026, 3:00 PM" */
export function formatDateTime(value) {
  return formatDate(value, 'd MMM yyyy, h:mm a')
}

/** formatTime(...) -> "3:00 PM" */
export function formatTime(value) {
  return formatDate(value, 'h:mm a')
}

/** formatRelativeTime(...) -> "5 minutes ago" / "in 2 days" */
export function formatRelativeTime(value) {
  const date = toDate(value)
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : EMPTY
}

/** getInitials('Ananya Sharma') -> "AS" */
export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** pluralize(1, 'item') -> "1 item" · pluralize(3, 'item') -> "3 items" · pluralize(2, 'category', 'categories') */
export function pluralize(count, singular, plural = `${singular}s`) {
  const number = toNumber(count)
  return `${formatNumber(number)} ${number === 1 ? singular : plural}`
}

export function truncate(text = '', max = 60) {
  const value = String(text)
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value
}

/** titleCase('bank_transfer') -> "Bank Transfer" */
export function titleCase(text = '') {
  return String(text)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/** Stable small hash of a string: used to pick a repeatable colour for a name. */
export function hashString(text = '') {
  let hash = 0
  const value = String(text)
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** Percentage change from previous to current. Returns null when there is nothing to compare with. */
export function percentChange(current, previous) {
  const now = toNumber(current)
  const before = toNumber(previous)
  if (before === 0) return now === 0 ? 0 : null
  return ((now - before) / Math.abs(before)) * 100
}

/** Round money to 2 decimals without floating point drift. */
export function roundMoney(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100
}
