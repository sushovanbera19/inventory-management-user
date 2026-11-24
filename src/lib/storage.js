/**
 * Safe JSON wrappers around localStorage.
 * Falls back to an in-memory store when localStorage is unavailable
 * (private mode, blocked storage, or Node while running unit tests).
 */

const memoryStore = new Map()

function getStore() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    /* access denied: use memory */
  }
  return null
}

export function readStorage(key, fallback = null) {
  try {
    const store = getStore()
    const raw = store ? store.getItem(key) : memoryStore.get(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  const raw = JSON.stringify(value)
  try {
    const store = getStore()
    if (store) store.setItem(key, raw)
    else memoryStore.set(key, raw)
    return true
  } catch {
    // Quota exceeded or storage blocked: keep the value for this session only.
    memoryStore.set(key, raw)
    return false
  }
}

export function removeStorage(key) {
  try {
    const store = getStore()
    if (store) store.removeItem(key)
  } catch {
    /* ignore */
  }
  memoryStore.delete(key)
}
