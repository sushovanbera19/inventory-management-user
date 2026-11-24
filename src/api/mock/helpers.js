/**
 * Small tools shared by the demo (mock) API: fake network delay, deep copies, errors,
 * list filtering / sorting / paging, date keys and id generation.
 */
import { format, parseISO } from 'date-fns'
import { ApiError } from '../client.js'
import { IS_TEST } from '../config.js'

/** Wait like a real network request would (220–520 ms), but not while unit tests run. */
export function delay() {
  if (IS_TEST) return Promise.resolve()
  const ms = 220 + Math.round(Math.random() * 300)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Deep copy, so callers can never change the stored data by accident. */
export function clone(value) {
  return value === undefined ? undefined : structuredClone(value)
}

/** Run a mock handler like a request: wait, run, return a copy (or reject with its ApiError). */
export async function respond(handler) {
  await delay()
  return clone(handler())
}

/* ---------- Errors ---------------------------------------------------------- */

export const badRequest = (message) => new ApiError({ status: 400, message })
export const unauthorized = (message = 'Please sign in to continue.') => new ApiError({ status: 401, message })
export const notFound = (what = 'Record') => new ApiError({ status: 404, message: `${what} not found.` })
export const conflict = (message, fieldErrors) => new ApiError({ status: 409, message, fieldErrors })
export const invalid = (message, fieldErrors) => new ApiError({ status: 422, message, fieldErrors })

/* ---------- Ids ------------------------------------------------------------- */

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** newId('prd') -> "prd_k3x9a1bq". Pass `random` (0..1 generator) for repeatable ids in the seed. */
export function newId(prefix, random = Math.random) {
  let id = ''
  for (let index = 0; index < 8; index += 1) id += ID_CHARS[Math.floor(random() * ID_CHARS.length)]
  return `${prefix}_${id}`
}

/* ---------- Dates ----------------------------------------------------------- */

/** Local calendar day of a date or ISO string: "2026-11-14". */
export function dayKey(value) {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'yyyy-MM-dd')
}

export const nowIso = () => new Date().toISOString()

/** True when the ISO timestamp falls inside the inclusive 'yyyy-MM-dd' range (either end optional). */
export function inDayRange(iso, from, to) {
  const key = dayKey(iso)
  if (from && key < from) return false
  if (to && key > to) return false
  return true
}

/* ---------- Lists ----------------------------------------------------------- */

/** '', null, undefined and 'all' mean "no filter". */
export function isUnset(value) {
  return value === undefined || value === null || value === '' || value === 'all'
}

/** Case-insensitive "contains" over several fields (dotted paths allowed: 'customer.name'). */
export function matchesSearch(row, search, fields) {
  if (isUnset(search)) return true
  const needle = String(search).trim().toLowerCase()
  if (!needle) return true
  return fields.some((field) => {
    const value = field.split('.').reduce((current, part) => current?.[part], row)
    return value != null && String(value).toLowerCase().includes(needle)
  })
}

/**
 * Sort a copy of `rows`. `sorters` maps a sortBy name to a getter; unknown names fall back
 * to the default. Text compares naturally ("SKU-2" before "SKU-10"), nulls go last.
 */
export function sortRows(rows, { sortBy, sortDir }, sorters, fallback) {
  const key = sorters[sortBy] ? sortBy : fallback.sortBy
  const dir = sortDir === 'asc' || sortDir === 'desc' ? sortDir : sorters[sortBy] ? 'asc' : fallback.sortDir
  const getter = sorters[key]
  const factor = dir === 'desc' ? -1 : 1

  return [...rows].sort((a, b) => {
    const left = getter(a)
    const right = getter(b)
    if (left == null && right == null) return 0
    if (left == null) return 1
    if (right == null) return -1
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor
    return String(left).localeCompare(String(right), 'en', { numeric: true, sensitivity: 'base' }) * factor
  })
}

/** Cut one page out of the rows: { data, meta: { page, pageSize, total, totalPages } }. */
export function paginate(rows, params = {}, defaultPageSize = 10) {
  const pageSize = Math.min(Math.max(Number(params.pageSize) || defaultPageSize, 1), 200)
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(Number(params.page) || 1, 1), totalPages)
  const start = (page - 1) * pageSize
  return { data: rows.slice(start, start + pageSize), meta: { page, pageSize, total, totalPages } }
}

/* ---------- Validation ------------------------------------------------------ */

/** Number that is finite and >= 0, or the fallback. */
export function nonNegative(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

/** Collects field problems and throws one 422 with all of them. */
export function validator() {
  const fieldErrors = {}
  return {
    require(field, value, label) {
      if (value === undefined || value === null || String(value).trim() === '') fieldErrors[field] = `${label} is required.`
    },
    number(field, value, label, { min = 0, integer = false } = {}) {
      if (value === undefined || value === null || value === '') return
      const number = Number(value)
      if (!Number.isFinite(number)) fieldErrors[field] = `${label} must be a number.`
      else if (number < min) fieldErrors[field] = `${label} cannot be less than ${min}.`
      else if (integer && !Number.isInteger(number)) fieldErrors[field] = `${label} must be a whole number.`
    },
    email(field, value) {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) fieldErrors[field] = 'Enter a valid email address.'
    },
    add(field, message) {
      fieldErrors[field] = message
    },
    done() {
      const fields = Object.keys(fieldErrors)
      if (fields.length) throw invalid(fieldErrors[fields[0]], fieldErrors)
    },
  }
}

/** Trimmed text or '' (keeps optional fields tidy). */
export const text = (value) => (value == null ? '' : String(value).trim())
