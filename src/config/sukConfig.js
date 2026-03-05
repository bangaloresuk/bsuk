// ============================================================
//  SUK CONFIGURATION — Single source of truth
//  ─────────────────────────────────────────────────────────
//  HOW TO ADD A NEW SUK:
//  1. Copy any "configured: true" block below
//  2. Set a unique key (lowercase, hyphens only)
//  3. Fill in scriptUrl + apiKey from your Google Apps Script
//  4. Set configured: true
//  5. Save — it appears automatically in the dropdown
//
//  HOW TO DISABLE A FEATURE FOR ONE SUK:
//  Add features: { satsangBooking: false, messages: false }
//  Full feature list → DEFAULT_FEATURES below
// ============================================================

// Add this at the top
const WORKER_URL = 'https://bangaloresuk-proxy.bangaloresuk.workers.dev'
// ── Default feature flags — every SUK inherits these ─────────
export const DEFAULT_FEATURES = {
  prayerBooking:   true,   // Morning / Evening prayer booking
  satsangBooking:  true,   // Satsang gathering booking
  cancelBooking:   true,   // Cancel button
  retrieveBooking: true,   // Retrieve booking by mobile
  allBookings:     true,   // All Bookings calendar view
  prayerTimes:     true,   // Prayer Timings reference
  messages:        true,   // Invitation & message creator
  photoGallery:    true,   // Photo upload & gallery
}

// ── SUK registry ─────────────────────────────────────────────
export const SUK_CONFIG = {

  // ── ACTIVE SUKs ──────────────────────────────────────────

  'bannerghatta': {
    key:        'bannerghatta',
    name:       'Bannerghatta Satsang Upayojana Kendra',
    shortName:  'Bannerghatta SUK',
    emoji:        "🪷",
    location:   'Bangalore South',
    scriptUrl:  WORKER_URL,
    apiKey:     'bannerghatta',
    configured: true,
    features:   {},                         // uses all DEFAULT_FEATURES
  },

  'peenya-2nd-stage': {
    key:        'peenya-2nd-stage',
    name:       'Peenya 2nd Stage SUK',
    shortName:  'Peenya 2nd Stage SUK',
    emoji:        "🪷",
    location:   '',
    scriptUrl:  WORKER_URL,
    apiKey:     'peenya-2nd-stage',
    configured: true,
    features:   { satsangBooking: false, messages: false },
  },

  'banashankari': {
    key:        'banashankari',
    name:       'Banashankari SUK',
    shortName:  'Banashankari SUK',
    emoji:        "🪷",
    location:   '',
    scriptUrl:  WORKER_URL,
    apiKey:     'banashankari',
    configured: true,
    features:   { satsangBooking: false, messages: false },
  },

  // ── COMING SOON — set configured:true + add scriptUrl/apiKey when ready ──

  'itpl-main-road':            { key: 'itpl-main-road',            shortName: 'ITPL Main Road SUK',               configured: false, features: {} },
  'sidhappa-layout':           { key: 'sidhappa-layout',           shortName: 'Sidhappa Layout SUK',              configured: false, features: {} },
  'bomanahalli':               { key: 'bomanahalli',               shortName: 'Bomanahalli SUK',                  configured: false, features: {} },
  'garvebhavi-palya':          { key: 'garvebhavi-palya',          shortName: 'Garvebhavi Palya SUK',             configured: false, features: {} },
  'hoskote':                   { key: 'hoskote',                   shortName: 'Hoskote SUK',                      configured: false, features: {} },
  'domlur':                    { key: 'domlur',                    shortName: 'Domlur SUK',                       configured: false, features: {} },
  'sarjapura-road':            { key: 'sarjapura-road',            shortName: 'Sarjapura Road SUK',               configured: false, features: {} },
  'jp-park':                   { key: 'jp-park',                   shortName: 'J P Park SUK',                     configured: false, features: {} },
  'marathahalli':              { key: 'marathahalli',              shortName: 'Marathahalli SUK',                 configured: false, features: {} },
  'dasarahalli':               { key: 'dasarahalli',               shortName: 'Dasarahalli SUK',                  configured: false, features: {} },
  'kamakshipalya':             { key: 'kamakshipalya',             shortName: 'Kamakshipalya / Kottigepalya SUK', configured: false, features: {} },
  'anantha-nagar':             { key: 'anantha-nagar',             shortName: 'Anantha Nagar SUK',                configured: false, features: {} },
  'btm-layout':                { key: 'btm-layout',                shortName: 'BTM Layout SUK',                   configured: false, features: {} },
  'ejipura':                   { key: 'ejipura',                   shortName: 'Ejipura SUK',                      configured: false, features: {} },
  'chandapura':                { key: 'chandapura',                shortName: 'Chandapura SUK',                   configured: false, features: {} },
  'hosa-road':                 { key: 'hosa-road',                 shortName: 'Hosa Road SUK',                    configured: false, features: {} },
  'murugeshpalya':             { key: 'murugeshpalya',             shortName: 'Murugeshpalya / HAL Area SUK',     configured: false, features: {} },
  'banaswadi':                 { key: 'banaswadi',                 shortName: 'Banaswadi SUK',                    configured: false, features: {} },
  'yelahanka':                 { key: 'yelahanka',                 shortName: 'Yelahanka SUK',                    configured: false, features: {} },
  'hsr-layout':                { key: 'hsr-layout',                shortName: 'HSR Layout SUK',                   configured: false, features: {} },
  'hebbagudi':                 { key: 'hebbagudi',                 shortName: 'Hebbagudi / Daadys Gaarden SUK',   configured: false, features: {} },
  'electronic-city':           { key: 'electronic-city',           shortName: 'Electronic City SUK',              configured: false, features: {} },
  'horamavu':                  { key: 'horamavu',                  shortName: 'Horamavu SUK',                     configured: false, features: {} },
  'cv-raman-nagar':            { key: 'cv-raman-nagar',            shortName: 'C V Raman Nagar SUK',              configured: false, features: {} },
  'maruthi-nagar-bommasandra': { key: 'maruthi-nagar-bommasandra', shortName: 'Maruthi Nagar Bommasandra SUK',    configured: false, features: {} },
  'kadugodi':                  { key: 'kadugodi',                  shortName: 'Kadugodi SUK',                     configured: false, features: {} },
  'kumaraswamy-layout':        { key: 'kumaraswamy-layout',        shortName: 'Kumaraswamy Layout SUK',           configured: false, features: {} },
  'hmt-area':                  { key: 'hmt-area',                  shortName: 'HMT Area SUK',                     configured: false, features: {} },
  'tavarekere':                { key: 'tavarekere',                shortName: 'Tavarekere SUK',                   configured: false, features: {} },
  'anjana-nagar':              { key: 'anjana-nagar',              shortName: 'Anjana Nagar SUK',                 configured: false, features: {} },
  'kundanahalli':              { key: 'kundanahalli',              shortName: 'Kundanahalli SUK',                 configured: false, features: {} },
}

// ── Helper ───────────────────────────────────────────────────
/** Returns display label for a SUK object */
export function sukLabel(suk) {
  if (!suk) return ''
  return suk.shortName || suk.name || ''
}
