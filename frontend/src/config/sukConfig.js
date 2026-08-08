// ============================================================
//  SUK CONFIGURATION — Single source of truth
//  API URL comes from env — never hardcoded in this file.
//  GitHub Actions injects VITE_API_URL from GitHub Secret.
//  Local dev: set VITE_API_URL in frontend/.env.local
// ============================================================

// In production, silently falling back to localhost is exactly how
// a deploy without VITE_API_URL set went live pointing at localhost.
// So: only use the localhost fallback in dev. In a production build
// missing the env var, log a loud, unmissable console error instead —
// NOT a thrown error, since throwing here (at module load, before
// React even mounts) crashes the entire app with a frozen splash
// screen and no visible explanation. Falling through to '' means API
// calls will fail as relative-path 404s, which is easy to diagnose
// in the Network tab, while the rest of the site still loads normally.
const rawApiUrl = import.meta.env.VITE_API_URL
if (!rawApiUrl && !import.meta.env.DEV) {
  console.error(
    '⚠️ VITE_API_URL is not set for this production build. ' +
    'All API calls will fail. Check the VITE_API_URL secret in GitHub Actions ' +
    'and redeploy.'
  )
}
const WORKER_URL = rawApiUrl || (import.meta.env.DEV ? 'http://localhost:8000' : '')

export const DEFAULT_FEATURES = {
  prayerBooking:   true,
  satsangBooking:  true,
  bhadraBooking:   false,   // Bhadra Parikrama Satsang — opt-in per SUK
  matriBooking:    false,   // Matri-Sammelan            — opt-in per SUK
  savanBooking:    false,   // Savan Parikrama           — opt-in per SUK
  cancelBooking:   true,
  retrieveBooking: true,
  allBookings:     true,
  prayerTimes:     true,
  messages:        true,
  photoGallery:    true,
}

// ============================================================
//  BLOCKED BOOKING DATES — full control, edit this file only
//
//  Two dials, both in this file. A date is actually blocked for
//  a SUK + booking type ONLY when BOTH say "yes":
//
//  DIAL 1 — GLOBAL_BLOCKED_DATES (below): for each date, which
//    booking types does it apply to? Set true/false per type —
//    any combination is fine (e.g. block Bhadra + Savan on a
//    date but leave Prayer + Satsang + Matri open).
//
//  DIAL 2 — each SUK's `blockDatesEnabled` (further down, in
//    SUK_CONFIG): does THIS SUK observe blocked dates at all,
//    and for which booking types? Also any combination — one
//    SUK might enforce it only for Bhadra, another for everything.
//
//  HOW TO USE:
//    1. Add a date below with the types it should block.
//    2. On each SUK you want it to apply to, set that same
//       type to true in blockDatesEnabled.
//    3. Redeploy. Both the frontend (instant UI message) and
//       backend (rejects the API call) enforce it —
//       just mirror the same two dials in
//       backend/shared/blocked_dates.py.
//
//  Booking type keys used everywhere below: 'prayer', 'satsang',
//  'bhadra', 'matri', 'savan'.
// ============================================================

// DIAL 1 — the dates, and which booking types each one blocks.
// Any type left out / set to false stays open on that date.
export const GLOBAL_BLOCKED_DATES = [
  {
    date: '2026-08-10',
    reason: '133rd Abirvab Tithi Of Sree Sree Boroma (Central Celebration)',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-08-11',
    reason: '33rd Tirodhan Tithi Of Sree Sree Borda (Havishyanna)',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-09-02',
    reason: '81st Deoghar Subha Agaman Divas Of Sree Sree Thakur (Central Celebration)',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-09-16',
    reason: '139th Abirvab Divas Of Sree Sree Thakur',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-09-20',
    reason: '139th Abirvab Tithi Of Sree Sree Thakur (Central Celebration)',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-10-21',
    reason: '94th Abirvab Divas Of Sree Sree Dada',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-10-23',
    reason: '139th Janma Mohatsav Of Sree Sree Thakur & 345th All India Ritwik Conference',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-10-24',
    reason: '139th Janma Mohatsav Of Sree Sree Thakur & 345th All India Ritwik Conference',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-11-21',
    reason: '116th Abirvab Divas Of Sree Sree Borda',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-12-10',
    reason: '116th Abirvab Tithi Of Sree Sree Borda (Central Celebration)',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2026-12-31',
    reason: '116th Janma Mohatsav Of Sree Sree Borda & 346th All India Ritwik Conference',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
  {
    date: '2027-01-01',
    reason: '116th Janma Mohatsav Of Sree Sree Borda & 346th All India Ritwik Conference',
    types: { prayer: true, satsang: true, bhadra: true, matri: true, savan: true },
  },
]

// A SUK with no `blockDatesEnabled` at all is fully OFF — every type ignores
// GLOBAL_BLOCKED_DATES for that SUK. This is the shape DIAL 2 uses per SUK.
const BLOCK_DATES_OFF = { prayer: false, satsang: false, bhadra: false, matri: false, savan: false }

// Returns the blocked-date entry ({ date, reason, types }) if `bookingType`
// is blocked on `dateStr` for this SUK, or null if it's open. Checks:
//   1. Does this SUK have the toggle ON for this booking type? (DIAL 2)
//   2. Does this date block this booking type? (DIAL 1)
// Both must be true for the date to actually be blocked.
export function getBlockedDateInfo(suk, dateStr, bookingType) {
  if (!dateStr || !bookingType) return null
  const sukToggles = suk?.blockDatesEnabled || BLOCK_DATES_OFF
  if (!sukToggles[bookingType]) return null
  const entry = GLOBAL_BLOCKED_DATES.find(b => b.date === dateStr)
  if (!entry || !entry.types?.[bookingType]) return null
  return entry
}

export const SUK_CONFIG = {
  'bannerghatta': {
    key: 'bannerghatta', name: 'Bannerghatta Satsang Upayojana Kendra',
    shortName: 'Bannerghatta SUK', emoji: '🪷', location: 'Bangalore South',
    scriptUrl: WORKER_URL, apiKey: 'bannerghatta', configured: true,
    features: { bhadraBooking: true, matriBooking: false, savanBooking: true },
    // DIAL 2 — which booking types observe GLOBAL_BLOCKED_DATES for THIS SUK.
    blockDatesEnabled: { prayer: false, satsang: true, bhadra: true, matri: true, savan: true },
  },
  'peenya-2nd-stage': {
    key: 'peenya-2nd-stage', name: 'Peenya 2nd Stage SUK',
    shortName: 'Peenya 2nd Stage SUK', emoji: '🪷', location: '',
    scriptUrl: WORKER_URL, apiKey: 'peenya-2nd-stage', configured: true,
    features: { satsangBooking: false, messages: false },
    blockDatesEnabled: { prayer: false, satsang: true, bhadra: true, matri: true, savan: true },
  },
  'banashankari': {
    key: 'banashankari', name: 'Banashankari SUK',
    shortName: 'Banashankari SUK', emoji: '🪷', location: '',
    scriptUrl: WORKER_URL, apiKey: 'banashankari', configured: true,
    features: { bhadraBooking: true, matriBooking: false, savanBooking: true  },
    blockDatesEnabled: { prayer: false, satsang: true, bhadra: true, matri: true, savan: true },
  },
  'marathahalli': {
    key: 'marathahalli', name: 'Marathahalli SUK',
    shortName: 'Marathahalli SUK', emoji: '🪷', location: 'marathahalli',
    scriptUrl: WORKER_URL, apiKey: 'marathahalli', configured: true,
    features: { satsangBooking: false, messages: false },
    blockDatesEnabled: { prayer: false, satsang: true, bhadra: true, matri: true, savan: true },
  },
  'electronic-city': {
    key: 'electronic-city', name: 'Electronic City Satsang Upayojana Kendra',
    shortName: 'Electronic City SUK', emoji: '🪷', location: 'Electronic City',
    scriptUrl: WORKER_URL, apiKey: 'electronic-city', configured: true,
    features: {
      prayerBooking:   false,
      satsangBooking:  false,
      bhadraBooking:   true,
      matriBooking:    false,
      savanBooking:    false,
    },
    blockDatesEnabled: { prayer: false, satsang: true, bhadra: true, matri: true, savan: true },
  },
  'garvebhavi-palya': {
    key: 'garvebhavi-palya', name: 'Garvebhavi Palya Satsang Upayojana Kendra',
    shortName: 'Garvebhavi Palya SUK', emoji: '🪷', location: 'Garvebhavi Palya',
    scriptUrl: WORKER_URL, apiKey: 'garvebhavi-palya', configured: true,
    features: {
      prayerBooking:   false,
      satsangBooking:  false,
      bhadraBooking:   true,
      matriBooking:    false,
      savanBooking:    false,
    },
    blockDatesEnabled: { prayer: false, satsang: true, bhadra: true, matri: true, savan: true },
  },
  'itpl-main-road':            { key: 'itpl-main-road',            shortName: 'ITPL Main Road SUK',               configured: false, features: {} },
  'sidhappa-layout':           { key: 'sidhappa-layout',           shortName: 'Sidhappa Layout SUK',              configured: false, features: {} },
  'bomanahalli':               { key: 'bomanahalli',               shortName: 'Bomanahalli SUK',                  configured: false, features: {} },
  'hoskote':                   { key: 'hoskote',                   shortName: 'Hoskote SUK',                      configured: false, features: {} },
  'domlur':                    { key: 'domlur',                    shortName: 'Domlur SUK',                       configured: false, features: {} },
  'sarjapura-road':            { key: 'sarjapura-road',            shortName: 'Sarjapura Road SUK',               configured: false, features: {} },
  'jp-park':                   { key: 'jp-park',                   shortName: 'J P Park SUK',                     configured: false, features: {} },
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

export function sukLabel(suk) {
  if (!suk) return ''
  return suk.shortName || suk.name || ''
}