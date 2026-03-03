# SUK Bangalore — Complete End-to-End Implementation Guide
## GitHub Pages + Cloudflare Worker (Secure Architecture)

---

## 📦 What You Get

```
YOUR GITHUB REPO (public — no secrets)
├── index.html              ← HTML shell + CSS + script loader
├── app.js                  ← React app, welcome screen, SUK switcher
├── sw.js                   ← Service Worker (PWA offline support)
├── manifest.json           ← PWA manifest (keep your existing one)
├── icons/                  ← Keep your existing icons
├── core/
│   ├── config.js           ← SUK list, prayer times, helpers (NO secrets)
│   ├── api.js              ← API calls to Cloudflare Worker
│   └── auth.js             ← Session handling, deep links
├── ui/
│   ├── particles.js        ← Background animations
│   ├── loader.js           ← Loading skeletons
│   └── modal.js            ← Confirmation modals
└── features/
    ├── booking.js          ← Prayer booking form
    ├── satsang.js          ← Satsang booking form
    ├── manage.js           ← Retrieve/cancel bookings
    ├── calendar.js         ← All bookings calendar view
    ├── messages.js         ← Message composer
    └── gallery.js          ← Photo gallery

CLOUDFLARE WORKER (private — real secrets live here)
└── worker.js               ← Secure proxy with token auth
```

**Security model:** Real Google Script URLs and API keys are ONLY in the Cloudflare Worker.
GitHub has zero secrets. Anyone can read your repo and cannot access your sheets.

---

## STEP 1 — Deploy Cloudflare Worker

### 1A — Install Wrangler (Cloudflare CLI)
```bash
npm install -g wrangler
wrangler login
```

### 1B — Create Worker project
```bash
mkdir suk-worker
cd suk-worker
```

Copy `worker.js` and `wrangler.toml` from this package into the `suk-worker/` folder.

**Edit `worker.js`** — the `SUK_REGISTRY` at the top already has your real credentials.
This file stays LOCAL — never goes to GitHub.

### 1C — Deploy the Worker
```bash
wrangler deploy
```

You'll get a URL like: `https://suk-bangalore.bangaloresuk.workers.dev`

### 1D — Set the token secret
This makes tokens unguessable. Run once after deploying:
```bash
wrangler secret put TOKEN_SECRET
# When prompted, enter any long random string, e.g.:
# a9f3b2e1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1
# Generate one: openssl rand -hex 32
```

### 1E — Verify Worker is live
Open in browser: `https://suk-bangalore.bangaloresuk.workers.dev/api/token`
You should see: `{"success":false,"error":"..."}`  ← This means it's working!

---

## STEP 2 — Set Up GitHub Repository

### 2A — Create or use existing GitHub repo
Your repo should be: `https://github.com/yourusername/your-repo-name`

GitHub Pages should be enabled:
- Go to repo → Settings → Pages
- Source: Deploy from branch → main → / (root)

### 2B — Push all frontend files to GitHub
Your repo structure should look like this:
```
your-repo/
├── index.html
├── app.js
├── sw.js
├── manifest.json
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── core/
│   ├── config.js
│   ├── api.js
│   └── auth.js
├── ui/
│   ├── particles.js
│   ├── loader.js
│   └── modal.js
└── features/
    ├── booking.js
    ├── satsang.js
    ├── manage.js
    ├── calendar.js
    ├── messages.js
    └── gallery.js
```

**NEVER push `worker.js` or `wrangler.toml` to GitHub.**
Add these to `.gitignore`:
```
# Cloudflare Worker (contains real secrets)
suk-worker/
worker.js
wrangler.toml
.wrangler/
```

### 2C — Commit and push
```bash
git add .
git commit -m "Deploy modular SUK app"
git push origin main
```

GitHub Pages will deploy in ~1-2 minutes.

---

## STEP 3 — Verify Everything Works

Open your GitHub Pages URL, then test each item:

### ✅ Checklist
- [ ] Splash screen appears (lotus + Jayguru animation)
- [ ] Welcome screen shows "Select Your Kendra" dropdown
- [ ] Search in dropdown works (type "Peenya")
- [ ] Inactive SUKs show "Soon" badge
- [ ] Select Bannerghatta → connects and enters app
- [ ] Book Prayer tab loads with date chips
- [ ] Book a Morning slot → success modal appears
- [ ] Share on WhatsApp button works
- [ ] Cancel a booking via "Need to cancel?" section
- [ ] Manage tab → enter mobile → shows bookings
- [ ] All Bookings tab shows calendar view
- [ ] Prayer Times tab shows monthly table
- [ ] Messages tab builds invitation text
- [ ] Gallery tab loads photos
- [ ] "← Change" button returns to welcome screen
- [ ] Refresh page → session restores (stays logged in)
- [ ] PWA install prompt appears on Android Chrome

---

## STEP 4 — Adding a New SUK

### In `worker.js` (on your local machine, then redeploy):
```js
const SUK_REGISTRY = {
  // ... existing SUKs ...
  "hsr-layout": {
    scriptUrl: "https://script.google.com/macros/s/YOUR_NEW_SCRIPT_URL/exec",
    apiKey:    "YOUR_NEW_API_KEY",
  },
};
```
Then: `wrangler deploy`

### In `core/config.js` (in GitHub):
Find the COMING SOON section and change `configured: false` to `configured: true`:
```js
"hsr-layout": {
  key:        "hsr-layout",
  shortName:  "HSR Layout SUK",
  emoji:      "🪷",
  themeColor: "#1d4ed8",
  scriptUrl:  "https://suk-bangalore.bangaloresuk.workers.dev",  // ← Worker URL
  apiKey:     "hsr-layout",   // ← Just the suk key, NOT the real API key
  configured: true,
  features:   {},
},
```

No other file needs to change. Push to GitHub and deploy Worker. Done. 🙏

---

## STEP 5 — Disabling Features for a SUK

In `core/config.js`, add flags in the `features` object:
```js
"peenya-2nd-stage": {
  ...
  features: {
    satsangBooking: false,   // hides Satsang tab
    messages:       false,   // hides Messages tab
    photoGallery:   false,   // hides Gallery tab
  },
},
```

Available flags: `prayerBooking`, `satsangBooking`, `cancelBooking`,
`retrieveBooking`, `allBookings`, `prayerTimes`, `messages`, `photoGallery`

---

## STEP 6 — Updating the App After Deployment

1. Edit whatever files you need in your local GitHub folder
2. `git add . && git commit -m "your change" && git push`
3. GitHub Pages auto-deploys in ~1 minute
4. Users see the update on next visit (service worker fetches HTML fresh every time)

If you changed JS files and want users to get them immediately, bump the cache version in `sw.js`:
```js
const CACHE_VERSION = "suk-v5";  // increment this
```

---

## Architecture Overview

```
User's Browser
      │
      │  1. GET index.html (from GitHub Pages CDN)
      │  2. Loads core/, ui/, features/, app.js scripts
      │
      │  3. POST /api/token { sukKey: "bannerghatta" }
      │  4. ← { token: "xxx", expiresAt: 123 }
      │
      │  5. GET/POST /api/bannerghatta/book  + X-SUK-Token: xxx
      ▼
Cloudflare Worker  (suk-bangalore.bangaloresuk.workers.dev)
      │  Verifies HMAC token
      │  Looks up real scriptUrl + apiKey for "bannerghatta"
      │  Proxies request to Google with real apiKey injected
      ▼
Google Apps Script  (script.google.com — never exposed to browser)
      │
      ▼
Google Sheets  (your data)
```

**What's public (GitHub):** UI code, SUK names, prayer times, Worker URL  
**What's private (Worker):** Real Google Script URLs, real API keys, token secret  

---

## Troubleshooting

**Blank white screen after deploy**
→ Open DevTools Console (F12). Usually a script loading error.
→ Check that all 12 JS files exist in your GitHub repo.

**"Could not connect" on welcome screen**
→ Worker is not deployed or TOKEN_SECRET is not set.
→ Test: open `https://suk-bangalore.bangaloresuk.workers.dev/api/token` in browser.
→ Should return JSON (even an error), not a Worker error page.

**Bookings not saving / "Upstream error"**
→ The Google Script URL in `worker.js` might have changed.
→ Re-deploy the Apps Script and update `worker.js` → `wrangler deploy`.

**Old version showing after update**
→ Bump `CACHE_VERSION` in `sw.js`, commit and push.

**PWA not updating on Android**
→ Clear site data in Chrome settings for your domain, then reload.

**Token expired errors during use**
→ Tokens auto-refresh every 30 minutes. If you see this, check system clock.

---

*Jayguru 🙏 — Satsang Upayojana Kendra, Bangalore*
