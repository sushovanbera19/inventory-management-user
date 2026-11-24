/**
 * The HTTP client used when the app talks to a real backend (VITE_USE_MOCK=false),
 * plus ApiError: the one error type every xxxApi function rejects with (mock or real).
 */
import { API_BASE_URL } from './config.js'
import { getSession } from './session.js'

/** Name of the window event fired when the backend answers 401 to a signed-in request. */
export const UNAUTHORIZED_EVENT = 'inventra:unauthorized'

const DEFAULT_CODES = {
  0: 'network_error',
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation_error',
  500: 'server_error',
}

/**
 * Statuses used across the app:
 *   400 bad request · 401 not signed in · 404 not found · 409 conflict · 422 validation
 *   500 server error · 0 network failure (the server could not be reached)
 *
 * `fieldErrors` is { fieldName: 'message' } when the problem belongs to form fields, otherwise null.
 */
export class ApiError extends Error {
  constructor({ status = 500, message, code, fieldErrors, details } = {}) {
    super(message || 'Something went wrong. Please try again.')
    this.name = 'ApiError'
    this.status = status
    this.code = code ?? DEFAULT_CODES[status] ?? 'error'
    this.fieldErrors = fieldErrors ?? null
    this.details = details ?? null
  }
}

/** Build the full URL, leaving out params that are undefined, null or ''. Arrays repeat the key. */
function buildUrl(path, params) {
  const base = /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  if (!params) return base

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) value.forEach((entry) => query.append(key, String(entry)))
    else query.append(key, String(value))
  }
  const text = query.toString()
  return text ? `${base}${base.includes('?') ? '&' : '?'}${text}` : base
}

/** Read the response body: JSON when there is some, otherwise null (204 or an empty body). */
async function readBody(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Pick a readable message out of the usual error body shapes: { message } | { detail } | { error }. */
function messageFrom(body, status) {
  if (typeof body === 'string' && body.trim() && body.length < 300) return body.trim()
  if (body && typeof body === 'object') {
    for (const key of ['message', 'detail', 'error']) {
      const value = body[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
      if (value && typeof value === 'object' && typeof value.message === 'string') return value.message
    }
  }
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 404) return 'We could not find what you were looking for.'
  if (status >= 500) return 'The server ran into a problem. Please try again.'
  return `Request failed (${status}).`
}

function notifyUnauthorized() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
  }
}

async function request(method, path, { params, body, signal } = {}) {
  const headers = { Accept: 'application/json' }
  const token = getSession()?.token
  if (token) headers.Authorization = `Bearer ${token}`

  const init = { method, headers, signal }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(buildUrl(path, params), init)
  } catch (cause) {
    // A cancelled request is not an error worth reporting: let the caller see the abort.
    if (cause?.name === 'AbortError') throw cause
    throw new ApiError({
      status: 0,
      message: 'Could not reach the server. Check your connection and try again.',
      details: { cause: String(cause?.message ?? cause) },
    })
  }

  const data = await readBody(response)
  if (response.ok) return data

  // Only a request that carried a token can mean "your session ended".
  // A wrong password on the sign-in form is also a 401, but nobody is signed in yet.
  if (response.status === 401 && token) notifyUnauthorized()

  const errorBody = data && typeof data === 'object' ? data : {}
  throw new ApiError({
    status: response.status,
    message: messageFrom(data, response.status),
    code: typeof errorBody.code === 'string' ? errorBody.code : undefined,
    fieldErrors: errorBody.fieldErrors ?? errorBody.errors ?? null,
    details: errorBody.details ?? null,
  })
}

/**
 * http.get('/products', { params: { page: 2 }, signal })
 * http.post('/products', body) · http.put(path, body) · http.patch(path, body) · http.delete(path)
 * Each returns the parsed JSON (null for "204 No Content") and throws ApiError otherwise.
 */
export const http = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
}
