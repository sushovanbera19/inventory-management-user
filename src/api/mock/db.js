/**
 * The shop's demo database: built from the shared seed (same products, customers and orders as the
 * admin panel's demo), kept in memory and saved to this browser's localStorage after every change.
 */
import { STORAGE_KEYS } from '../../config/app.js'
import { readStorage, writeStorage } from '../../lib/storage.js'
import { DB_VERSION, buildSeed } from './seed.js'

const STALE_AFTER_MS = 12 * 60 * 60 * 1000
let db = null

function fresh() {
  const data = buildSeed(new Date())
  // Every demo customer can sign in with the demo password.
  data.customers.forEach((customer) => {
    customer.password = 'demo1234'
    customer.addresses = [{ id: `adr_${customer.id.slice(4)}`, label: 'Home', name: customer.name, phone: customer.phone, ...customer.address, isDefault: true }]
  })
  data.newsletter = []
  data.messages = []
  return data
}

export function getDb() {
  if (db) return db
  const stored = readStorage(STORAGE_KEYS.mockDb, null)
  const usable =
    stored && stored.version === DB_VERSION && Array.isArray(stored.products) && !(stored.pristine && Date.now() - new Date(stored.seededAt).getTime() > STALE_AFTER_MS)
  db = usable ? stored : fresh()
  if (!usable) writeStorage(STORAGE_KEYS.mockDb, db)
  return db
}

export function commit() {
  getDb().pristine = false
  writeStorage(STORAGE_KEYS.mockDb, db)
}

export function nextNumber(counter) {
  const current = getDb()
  const value = current.counters[counter]
  current.counters[counter] = value + 1
  return value
}
