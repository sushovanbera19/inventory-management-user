/**
 * Data-layer switches, read from the .env file (see .env.example).
 *   VITE_USE_MOCK=true   -> every xxxApi call is answered by the in-browser demo data (src/api/mock)
 *   VITE_USE_MOCK=false  -> every xxxApi call goes to your backend at VITE_API_BASE_URL
 */

// `import.meta.env` is filled in by Vite (and by Vitest). The fallback keeps plain Node happy.
const env = import.meta.env ?? {}

/** True unless VITE_USE_MOCK is exactly the text "false". */
export const USE_MOCK = env.VITE_USE_MOCK !== 'false'

/** Base URL of the real backend, without a trailing slash. */
export const API_BASE_URL = String(env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '')

/** True while unit tests run: the demo data layer then answers without its fake network delay. */
export const IS_TEST = env.MODE === 'test'
