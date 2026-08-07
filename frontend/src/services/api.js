// ============================================================
//  API SERVICE — thin adapter over the DB layer
//  ─────────────────────────────────────────────────────────
//  All app code imports from here. This file just re-exports
//  the db layer with the legacy { api, satsangApi, photoApi }
//  shape so App.jsx doesn't need to change.
//
//  If you want to call the db directly you can:
//  import db from '../db/index.js'
//  db.bookings.getAll()
// ============================================================

import db from '../db/index.js'

export const api = {
  getAll: ()              => db.bookings.getAll(),
  getCachedInstant: ()    => db.bookings.getCachedInstant(),
  post:   (data)          => db.bookings.add(data),
  delete: (id)            => db.bookings.cancel(id),
  cancel: (id)            => db.bookings.cancel(id),
  update: (id, place)     => db.bookings.updateAddress(id, place),
}

export const satsangApi = {
  getAll: ()     => db.satsang.getAll(),
  getCachedInstant: () => db.satsang.getCachedInstant(),
  post:   (data) => db.satsang.add(data),
  delete: (id)   => db.satsang.cancel(id),
  cancel: (id)   => db.satsang.cancel(id),  // ← this was missing, App.jsx calls satsangApi.cancel()
}

export const bhadraApi = {
  getAll: ()     => db.bhadra.getAll(),
  getCachedInstant: () => db.bhadra.getCachedInstant(),
  post:   (data) => db.bhadra.add(data),
  delete: (id)   => db.bhadra.cancel(id),
  cancel: (id)   => db.bhadra.cancel(id),
}

export const matriApi = {
  getAll: ()     => db.matri.getAll(),
  getCachedInstant: () => db.matri.getCachedInstant(),
  post:   (data) => db.matri.add(data),
  delete: (id)   => db.matri.cancel(id),
  cancel: (id)   => db.matri.cancel(id),
}

export const savanApi = {
  getAll: ()     => db.savan.getAll(),
  getCachedInstant: () => db.savan.getCachedInstant(),
  post:   (data) => db.savan.add(data),
  delete: (id)   => db.savan.cancel(id),
  cancel: (id)   => db.savan.cancel(id),
}

export const photoApi = {
  getAll:  ()                           => db.photos.getAll(),
  upload:  (base64, filename, caption, uploader) => db.photos.upload(base64, filename, caption, uploader),
  delete:  (photoId)                    => db.photos.delete(photoId),
}

export const locationApi = {
  search:  (q)        => db.location.search(q),
  place:   (placeId)  => db.location.place(placeId),
  reverse: (lat, lon) => db.location.reverse(lat, lon),
}