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

export const SUK_CONFIG = {
  'bannerghatta': {
    key: 'bannerghatta', name: 'Bannerghatta Satsang Upayojana Kendra',
    shortName: 'Bannerghatta SUK', emoji: '🪷', location: 'Bangalore South',
    scriptUrl: WORKER_URL, apiKey: 'bannerghatta', configured: true,
    features: { bhadraBooking: true, matriBooking: false, savanBooking: true },
  },
  'peenya-2nd-stage': {
    key: 'peenya-2nd-stage', name: 'Peenya 2nd Stage SUK',
    shortName: 'Peenya 2nd Stage SUK', emoji: '🪷', location: '',
    scriptUrl: WORKER_URL, apiKey: 'peenya-2nd-stage', configured: true,
    features: { satsangBooking: false, messages: false },
  },
  'banashankari': {
    key: 'banashankari', name: 'Banashankari SUK',
    shortName: 'Banashankari SUK', emoji: '🪷', location: '',
    scriptUrl: WORKER_URL, apiKey: 'banashankari', configured: true,
    features: { bhadraBooking: true, matriBooking: false, savanBooking: true  },
  },
  'marathahalli': {
    key: 'marathahalli', name: 'Marathahalli SUK',
    shortName: 'Marathahalli SUK', emoji: '🪷', location: 'marathahalli',
    scriptUrl: WORKER_URL, apiKey: 'marathahalli', configured: true,
    features: { satsangBooking: false, messages: false },
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