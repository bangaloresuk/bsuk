// ============================================================
//  DB PROVIDER — Google Apps Script + Google Sheets
//  Calls the Python FastAPI backend (Render) which then
//  calls GAS server-side. GAS URL never reaches the browser.
// ============================================================
import { getCached, setCached, invalidateCache } from '../../utils/apiCache.js'

const SHEET = {
  BOOKINGS: 'Bookings',
  SATSANG:  'Satsang',
  BHADRA:   'Bhadra',
  MATRI:    'Matri',
  SAVAN:    'Savan',
  PHOTOS:   'Photos',
}

let _scriptUrl = ''
let _apiKey    = ''

// e.g. '/booking/bookings/123' → '/booking/bookings' — used so cancelling
// or creating a booking invalidates the cached list for that resource.
function resourceRoot(path) {
  const parts = path.split('/').filter(Boolean)
  return '/' + parts.slice(0, 2).join('/')
}

async function apiCall(method, path, body = null, extraParams = {}) {
  const params = new URLSearchParams({ suk_key: _apiKey, ...extraParams })
  const url = `${_scriptUrl}${path}?${params}`
  const options = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) options.body = JSON.stringify(body)

  const result = await (async () => {
    try {
      const res = await fetch(url, options)
      return await res.json()
    } catch {
      return { success: false, message: 'Server error. Please try again.' }
    }
  })()

  if (method === 'GET') {
    // Write-through cache: only cache genuinely successful reads, so a
    // failed/errored GET never poisons the cache with a bad response.
    if (result && result.success) setCached(url, result)
  } else {
    // A booking was just created/cancelled/updated — the cached list for
    // this resource is now stale, force the next read to go to network.
    invalidateCache(resourceRoot(path))
  }

  return result
}

// Instant cache read for a GET call — lets callers paint stale-but-valid
// data immediately (from a previous visit this session) while the real
// apiCall() above refreshes it in the background. Returns null on a
// cache miss, in which case the caller should just wait on the real call.
function getCachedGet(path, extraParams = {}) {
  const params = new URLSearchParams({ suk_key: _apiKey, ...extraParams })
  const url = `${_scriptUrl}${path}?${params}`
  return getCached(url)
}

export const googleSheetsProvider = {

  configure({ scriptUrl, apiKey }) {
    _scriptUrl = scriptUrl
    _apiKey    = apiKey
  },

  bookings: {
    getAll:         ()           => apiCall('GET',    '/booking/bookings'),
    getCachedInstant: ()         => getCachedGet('/booking/bookings'),
    add:            (data)       => apiCall('POST',   '/booking/bookings', { ...data, suk_key: _apiKey }),
    cancel:         (id)         => apiCall('DELETE', `/booking/bookings/${id}`),
    updateAddress:  (id, place)  => apiCall('PATCH',  `/booking/bookings/${id}/address`, { id, place, suk_key: _apiKey }),
  },

  satsang: {
    getAll: ()     => apiCall('GET',    '/satsang/satsang'),
    getCachedInstant: () => getCachedGet('/satsang/satsang'),
    add:    (data) => apiCall('POST',   '/satsang/satsang', { ...data, suk_key: _apiKey }),
    cancel: (id)   => apiCall('DELETE', `/satsang/satsang/${id}`),
  },

  bhadra: {
    getAll: ()     => apiCall('GET',    '/bhadra/bhadra'),
    getCachedInstant: () => getCachedGet('/bhadra/bhadra'),
    add:    (data) => apiCall('POST',   '/bhadra/bhadra', { ...data, suk_key: _apiKey }),
    cancel: (id)   => apiCall('DELETE', `/bhadra/bhadra/${id}`),
  },

  matri: {
    getAll: ()     => apiCall('GET',    '/matri/matri'),
    getCachedInstant: () => getCachedGet('/matri/matri'),
    add:    (data) => apiCall('POST',   '/matri/matri', { ...data, suk_key: _apiKey }),
    cancel: (id)   => apiCall('DELETE', `/matri/matri/${id}`),
  },

  savan: {
    getAll: ()     => apiCall('GET',    '/savan/savan'),
    getCachedInstant: () => getCachedGet('/savan/savan'),
    add:    (data) => apiCall('POST',   '/savan/savan', { ...data, suk_key: _apiKey }),
    cancel: (id)   => apiCall('DELETE', `/savan/savan/${id}`),
  },

  photos: {
    getAll:  ()                                    => apiCall('GET',    '/gallery/photos'),
    upload:  (base64, filename, caption, uploader) => apiCall('POST',   '/gallery/photos', { base64, filename, caption, uploader, suk_key: _apiKey }),
    delete:  (photoId)                             => apiCall('DELETE', `/gallery/photos/${photoId}`),
  },

  location: {
    search:  (q)         => apiCall('GET', '/location/search', null, { q }),
    place:   (placeId)   => apiCall('GET', `/location/place/${placeId}`),
    reverse: (lat, lon)  => apiCall('GET', '/location/reverse', null, { lat, lon }),
  },
}