# 🪷 Jayguru SUK Booking System

Prayer slot & Satsang booking app for Satsang Upayojana Kendras (SUKs), Bangalore.

**Stack:** React 18 + Vite · **Backend:** Google Apps Script + Google Sheets · **Deploy:** GitHub Pages / Netlify / Vercel

---

## Project Structure

```
src/
│
├── main.jsx                      # Entry point — mounts React, loads particles
│
├── config/
│   ├── sukConfig.js              # ⭐ ADD NEW SUKs HERE — all SUK registry + feature flags
│   ├── activeSuk.js              # Runtime mutable state (set when user selects a SUK)
│   └── prayerTimes.js            # Monthly prayer times + slot constants
│
├── services/
│   └── api.js                    # All Google Apps Script HTTP calls (api, satsangApi, photoApi)
│
├── utils/
│   └── utils.js                  # Pure helper functions (date formatting, maskMobile, cleanTime)
│
├── styles/
│   └── global.css                # All CSS — design tokens, animations, utility classes
│
└── components/
    │
    ├── AppShell.jsx              # Root — handles SUK selection, session persistence
    │
    ├── welcome/
    │   ├── WelcomeScreen.jsx     # Landing page with SUK selector
    │   └── SUKSearchDropdown.jsx # Searchable dropdown with coming-soon states
    │
    ├── shared/
    │   ├── BlueDivider.jsx       # Decorative gold-blue divider
    │   ├── SkeletonCard.jsx      # Shimmer loading placeholder
    │   └── DataLoadingOverlay.jsx# Full-screen lotus spinner overlay
    │
    ├── tabs/
    │   ├── PrayerTimesTab.jsx    # Annual prayer timetable (no props needed)
    │   └── GalleryTab.jsx        # Photo upload + gallery grid
    │
    └── App.jsx                   # Smart container — all state, handlers, tab routing
```

---

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # → dist/ folder (ready to deploy)
npm run preview    # Preview the production build locally
```

---

## Adding a New SUK

Edit **`src/config/sukConfig.js`**:

```js
'my-new-suk': {
  key:        'my-new-suk',
  name:       'My New SUK Full Name',
  shortName:  'My New SUK',
  location:   'Bangalore East',
  scriptUrl:  'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  apiKey:     'YOUR_API_KEY',
  configured: true,         // ← set true when ready
  features:   {},           // ← uses all default features
},
```

The SUK appears **automatically** in the dropdown. No other code changes needed.

---

## Disabling Features Per SUK

```js
features: {
  satsangBooking:  false,   // hides Satsang tab
  messages:        false,   // hides Messages tab
  photoGallery:    false,   // hides Gallery
  allBookings:     false,   // hides All Bookings
}
```

Full feature list is in `sukConfig.js` → `DEFAULT_FEATURES`.

---

## Deploy to GitHub Pages

1. Update `vite.config.js`: set `base: '/your-repo-name/'` 
2. Create `.github/workflows/deploy.yml` (see below)
3. Push → GitHub Actions builds → auto-deploys

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Then: **GitHub repo → Settings → Pages → Source: gh-pages branch**

---

## Architecture Notes

### Why `activeSuk.js` is a mutable object (not React state)?

The `api.js` service layer runs **outside** React's render cycle. It needs to read `SCRIPT_URL` and `API_KEY` synchronously at call time. A shared mutable object is the cleanest solution — no context needed, no prop drilling into non-React code.

### Why App.jsx is still a single file?

Each tab section is deeply connected to the same state (bookings, satsangBookings, confirmations, cancel flows). Splitting them into separate components would require passing 20+ props or a context. The trade-off chosen here: **each tab's pure-display UI** is extracted into `tabs/` (PrayerTimesTab, GalleryTab), while the state-heavy tabs remain in App.jsx with clear section comments.

### Google Apps Script backend

The backend (your `.gs` file) is **not part of this repo**. It lives in Google Apps Script and is accessed via the deployed web app URL. Zero backend changes are needed to use this frontend.
