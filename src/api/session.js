/**
 * The signed-in session ({ token, user }) kept in localStorage.
 * The HTTP client reads the token from here; the auth provider writes it after sign-in.
 */
import { STORAGE_KEYS } from '../config/app.js'
import { readStorage, removeStorage, writeStorage } from '../lib/storage.js'

/** Returns { token, user } or null when nobody is signed in. */
export function getSession() {
  const session = readStorage(STORAGE_KEYS.session, null)
  if (!session || typeof session !== 'object' || typeof session.token !== 'string' || !session.token) return null
  return { token: session.token, user: session.user ?? null }
}

/** Remember the session returned by authApi.login(). */
export function setSession({ token, user } = {}) {
  const session = { token, user: user ?? null }
  writeStorage(STORAGE_KEYS.session, session)
  return session
}

/** Forget the session (sign out). */
export function clearSession() {
  removeStorage(STORAGE_KEYS.session)
}
