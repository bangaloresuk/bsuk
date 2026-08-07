// ============================================================
//  API CACHE — lightweight stale-while-revalidate helper
//  ─────────────────────────────────────────────────────────
//  Uses sessionStorage (not localStorage) on purpose: booking data
//  contains names/mobile numbers, so we don't want it lingering on
//  the device after the browser tab is closed — but within one
//  session, repeat visits/reloads get an instant cached paint
//  instead of waiting on a full network round-trip.
// ============================================================

const PREFIX  = 'bsuk_cache:'
const TTL_MS  = 5 * 60 * 1000 // 5 minutes — booking data changes; don't cache too long

export function getCached(key) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { value, ts } = JSON.parse(raw)
    if (Date.now() - ts > TTL_MS) return null
    return value
  } catch (e) { return null }
}

export function setCached(key, value) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ value, ts: Date.now() }))
  } catch (e) { /* storage full/unavailable — caching is a nice-to-have, fail silently */ }
}

// Clears any cached GET response whose key relates to this resource path,
// e.g. invalidateCache('/booking/bookings') after a booking is added/cancelled
// so the next read is forced fresh instead of serving stale cached data.
export function invalidateCache(pathFragment) {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(PREFIX) && k.includes(pathFragment)) {
        sessionStorage.removeItem(k)
      }
    }
  } catch (e) {}
}