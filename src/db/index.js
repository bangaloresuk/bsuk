// ============================================================
//  DB — Database Abstraction Layer
//  ─────────────────────────────────────────────────────────
//  This is the ONLY file the rest of the app imports for data.
//  Components and services never call fetch() or Firebase directly.
//
//  TO SWITCH BACKENDS:
//  1. Change PROVIDER below to 'firebase' (or any future provider)
//  2. Call db.configure({ ...credentials }) with the new credentials
//  3. Done — zero other changes needed anywhere in the app.
//
//  STANDARD INTERFACE (all providers must implement):
//
//  db.configure({ scriptUrl?, apiKey?, ... })
//
//  db.bookings.getAll()                → Promise<booking[]>
//  db.bookings.add(data)               → Promise<{ success, id, message }>
//  db.bookings.cancel(id)              → Promise<{ success, message }>
//  db.bookings.updateAddress(id, place)→ Promise<{ success, message }>
//
//  db.satsang.getAll()                 → Promise<satsang[]>
//  db.satsang.add(data)                → Promise<{ success, id, message }>
//  db.satsang.cancel(id)               → Promise<{ success, message }>
//
//  db.photos.getAll()                  → Promise<photo[]>
//  db.photos.upload(file, caption, uploader) → Promise<{ success, url, message }>
//
// ============================================================

import { googleSheetsProvider } from './providers/googleSheets.js'
import { firebaseProvider }      from './providers/firebase.js'

// ── ⭐ CHANGE THIS TO SWITCH BACKENDS ─────────────────────────
const PROVIDER = 'googleSheets'   // 'googleSheets' | 'firebase'
// ─────────────────────────────────────────────────────────────

const providers = {
  googleSheets: googleSheetsProvider,
  firebase:     firebaseProvider,
}

const db = providers[PROVIDER]

if (!db) {
  throw new Error(`Unknown DB provider: "${PROVIDER}". Check src/db/index.js`)
}

export default db
