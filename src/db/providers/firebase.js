// ============================================================
//  DB PROVIDER — Firebase / Firestore (future migration)
//  ─────────────────────────────────────────────────────────
//  To activate:
//  1. npm install firebase
//  2. Fill in your Firebase project credentials below
//  3. In src/db/index.js → change PROVIDER to 'firebase'
//
//  The rest of the app needs ZERO changes.
// ============================================================

// import { initializeApp }             from 'firebase/app'
// import { getFirestore, collection,
//          getDocs, addDoc, deleteDoc,
//          doc, updateDoc }            from 'firebase/firestore'
// import { getStorage, ref,
//          uploadBytes, getDownloadURL } from 'firebase/storage'

let _config = {}

export const firebaseProvider = {

  configure({ projectId, apiKey, storageBucket, appId }) {
    _config = { projectId, apiKey, storageBucket, appId }
    // const app = initializeApp({ apiKey, projectId, storageBucket, appId })
    // _db      = getFirestore(app)
    // _storage = getStorage(app)
  },

  bookings: {
    getAll:        ()          => Promise.reject('Firebase not yet configured'),
    add:           (data)      => Promise.reject('Firebase not yet configured'),
    cancel:        (id)        => Promise.reject('Firebase not yet configured'),
    updateAddress: (id, place) => Promise.reject('Firebase not yet configured'),
  },

  satsang: {
    getAll: ()     => Promise.reject('Firebase not yet configured'),
    add:    (data) => Promise.reject('Firebase not yet configured'),
    cancel: (id)   => Promise.reject('Firebase not yet configured'),
  },

  photos: {
    getAll:  ()                           => Promise.reject('Firebase not yet configured'),
    upload:  (file, caption, uploader)    => Promise.reject('Firebase not yet configured'),
  },
}
