// ============================================================
//  DB PROVIDER — Google Apps Script + Google Sheets
// ============================================================

const SHEET = {
  BOOKINGS: 'Bookings',
  SATSANG:  'Satsang',
  PHOTOS:   'Photos',
}

const LOCAL_TTL = 60 * 1000  // 60 seconds

let _scriptUrl = ''
let _apiKey    = ''

// ── localStorage cache helpers ────────────────────────────

function localGet(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > LOCAL_TTL) {
      localStorage.removeItem(key)
      return null
    }
    return data
  } catch {
    return null
  }
}

function localSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {}
}

function localBust(key) {
  try { localStorage.removeItem(key) } catch {}
}

function makeCacheKey(action, sheetName) {
  return `suk:${_apiKey}:${action}:${sheetName}`
}

// ── HTTP helpers ──────────────────────────────────────────
//
// GET:  params go in URL query string (normal)
// POST: apiKey goes ONLY in the JSON body with Content-Type header
//       so the Worker can parse it with request.json()
//       action/sheetName/id also go in URL so they survive
//       GAS's internal 302 redirect that drops the body

// All requests use POST — consistent path through the Worker,
// avoids GET body-parse crash in old Worker and GAS redirect issues.
async function gasPost(params) {
  const body = { ...params, apiKey: _apiKey }

  const urlParams = new URLSearchParams({
    action:    body.action    || '',
    sheetName: body.sheetName || 'Bookings',
    id:        body.id        || '',
    // uploader + caption also go in URL so GAS can read them from e.parameter
    // even when the large base64 body fails JSON.parse through the Cloudflare proxy
    ...(body.uploader ? { uploader: body.uploader } : {}),
    ...(body.caption  !== undefined && body.action === 'uploadPhoto' ? { caption: body.caption } : {}),
  })

  const res  = await fetch(`${_scriptUrl}?${urlParams}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const text = await res.text()
  try { return JSON.parse(text) }
  catch { return { success: false, message: 'Server error. Please try again.' } }
}

async function getCached(action, sheetName) {
  return await gasPost({ action, sheetName })
}

// ── Provider ──────────────────────────────────────────────

export const googleSheetsProvider = {

  configure({ scriptUrl, apiKey }) {
    _scriptUrl = scriptUrl
    _apiKey    = apiKey
  },

  // ── Prayer bookings ───────────────────────────────────────

  bookings: {
    getAll: () => getCached('getAll', SHEET.BOOKINGS),

    add: (data) => gasPost({ action: 'add', sheetName: SHEET.BOOKINGS, ...data })
      .then(res => { localBust(makeCacheKey('getAll', SHEET.BOOKINGS)); return res }),

    cancel: (id) => gasPost({ action: 'delete', id, sheetName: SHEET.BOOKINGS })
      .then(res => { localBust(makeCacheKey('getAll', SHEET.BOOKINGS)); return res }),

    updateAddress: (id, place) => gasPost({ action: 'updateAddress', id, place, sheetName: SHEET.BOOKINGS })
      .then(res => { localBust(makeCacheKey('getAll', SHEET.BOOKINGS)); return res }),
  },

  // ── Satsang bookings — identical pattern ─────────────────

  satsang: {
    getAll: () => getCached('getAll', SHEET.SATSANG),

    add: (data) => gasPost({ action: 'add', sheetName: SHEET.SATSANG, ...data })
      .then(res => { localBust(makeCacheKey('getAll', SHEET.SATSANG)); return res }),

    cancel: (id) => gasPost({ action: 'delete', id, sheetName: SHEET.SATSANG })
      .then(res => { localBust(makeCacheKey('getAll', SHEET.SATSANG)); return res }),
  },

  // ── Photo gallery ─────────────────────────────────────────

  photos: {
    getAll: () => getCached('getPhotos', SHEET.PHOTOS),

    upload: (base64, filename, caption = '', uploader = '') =>
      new Promise((resolve, reject) => {
        try {
          gasPost({
            action:   'uploadPhoto',
            base64,
            filename,
            caption,
            uploader,
          }).then(result => {
            localBust(makeCacheKey('getPhotos', SHEET.PHOTOS))
            resolve(result)
          }).catch(err => reject(err))
        } catch (err) {
          reject(err)
        }
      }),
  },
}