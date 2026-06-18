// ============================================================
//  DB PROVIDER — Google Apps Script + Google Sheets
//  Calls the Python FastAPI backend (Render) which then
//  calls GAS server-side. GAS URL never reaches the browser.
// ============================================================

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

async function apiCall(method, path, body = null) {
  const params = new URLSearchParams({ suk_key: _apiKey })
  const url = `${_scriptUrl}${path}?${params}`
  const options = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) options.body = JSON.stringify(body)
  const res = await fetch(url, options)
  try { return await res.json() }
  catch { return { success: false, message: 'Server error. Please try again.' } }
}

export const googleSheetsProvider = {

  configure({ scriptUrl, apiKey }) {
    _scriptUrl = scriptUrl
    _apiKey    = apiKey
  },

  bookings: {
    getAll:         ()           => apiCall('GET',    '/booking/bookings'),
    add:            (data)       => apiCall('POST',   '/booking/bookings', { ...data, suk_key: _apiKey }),
    cancel:         (id)         => apiCall('DELETE', `/booking/bookings/${id}`),
    updateAddress:  (id, place)  => apiCall('PATCH',  `/booking/bookings/${id}/address`, { id, place, suk_key: _apiKey }),
  },

  satsang: {
    getAll: ()     => apiCall('GET',    '/satsang/satsang'),
    add:    (data) => apiCall('POST',   '/satsang/satsang', { ...data, suk_key: _apiKey }),
    cancel: (id)   => apiCall('DELETE', `/satsang/satsang/${id}`),
  },

  bhadra: {
    getAll: ()     => apiCall('GET',    '/bhadra/bhadra'),
    add:    (data) => apiCall('POST',   '/bhadra/bhadra', { ...data, suk_key: _apiKey }),
    cancel: (id)   => apiCall('DELETE', `/bhadra/bhadra/${id}`),
  },

  matri: {
    getAll: ()     => apiCall('GET',    '/matri/matri'),
    add:    (data) => apiCall('POST',   '/matri/matri', { ...data, suk_key: _apiKey }),
    cancel: (id)   => apiCall('DELETE', `/matri/matri/${id}`),
  },

  savan: {
    getAll: ()     => apiCall('GET',    '/savan/savan'),
    add:    (data) => apiCall('POST',   '/savan/savan', { ...data, suk_key: _apiKey }),
    cancel: (id)   => apiCall('DELETE', `/savan/savan/${id}`),
  },

  photos: {
    getAll:  ()                                    => apiCall('GET',    '/gallery/photos'),
    upload:  (base64, filename, caption, uploader) => apiCall('POST',   '/gallery/photos', { base64, filename, caption, uploader, suk_key: _apiKey }),
    delete:  (photoId)                             => apiCall('DELETE', `/gallery/photos/${photoId}`),
  },
}
