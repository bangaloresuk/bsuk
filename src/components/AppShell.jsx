// ============================================================
//  AppShell — Root component
//  ─────────────────────────────────────────────────────────
//  Responsibilities:
//  • App is PUBLIC — no sign-in required to browse or book
//  • Reads SUK from URL deep-link or sessionStorage on load
//  • Shows WelcomeScreen until a SUK is selected
//  • Calls db.configure() with SUK credentials whenever SUK changes
//  • Mounts App with a key so it fully remounts on SUK switch
//  • Admin sign-in is accessible via the hamburger menu and
//    only required for admin-level actions (manage, gallery etc.)
// ============================================================

import React from 'react'
import { SUK_CONFIG } from '../config/sukConfig.js'
import state from '../config/activeSuk.js'
import db from '../db/index.js'
import App from './App.jsx'
import WelcomeScreen from './welcome/WelcomeScreen.jsx'
import SignIn from './auth/SignIn.jsx'

// ── Internal: apply a SUK — sets both legacy state + db layer ─
function applySuk(suk) {
  state.SCRIPT_URL = suk.scriptUrl || ''
  state.API_KEY    = suk.apiKey    || ''
  state.ACTIVE_SUK = suk
  db.configure({ scriptUrl: suk.scriptUrl || '', apiKey: suk.apiKey || '' })
}

// ── Read persisted user from sessionStorage ──────────────────
function readSavedUser() {
  try {
    const raw = sessionStorage.getItem('bsukUser')
    if (raw) return JSON.parse(raw)
  } catch(e) {}
  return null
}

function AppShell() {
  const deepLink = React.useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search)
      return { suk: p.get('suk'), open: p.get('open') }
    } catch (e) { return {} }
  }, [])

  // ── Auth state (null = not signed in as admin; app is still public) ──
  const [currentUser, setCurrentUser] = React.useState(() => readSavedUser())

  // showSignIn is true only when admin explicitly clicks sign-in
  const [showSignIn, setShowSignIn] = React.useState(false)

  const handleSignIn = (user) => {
    setCurrentUser(user)
    setShowSignIn(false)
  }

  const handleSignOut = () => {
    try { sessionStorage.removeItem('bsukUser') } catch(e) {}
    setCurrentUser(null)
  }

  // Triggered from App's hamburger → "Admin Sign In" button
  const handleRequestSignIn = () => {
    setShowSignIn(true)
  }

  // ── SUK state ─────────────────────────────────────────────
  const [selectedSuk, setSelectedSuk] = React.useState(() => {
    if (deepLink.suk) {
      const suk = SUK_CONFIG[deepLink.suk]
      if (suk?.configured) { applySuk(suk); return suk }
    }
    try {
      const saved = sessionStorage.getItem('activeSuk')
      if (saved) {
        const suk = SUK_CONFIG[saved]
        if (suk?.configured) { applySuk(suk); return suk }
      }
    } catch (e) {}
    return null
  })

  const [appKey, setAppKey] = React.useState(0)

  const handleSelectSuk = (suk) => {
    applySuk(suk)
    try { sessionStorage.setItem('activeSuk', suk.key) } catch (e) {}
    setSelectedSuk(suk)
    setAppKey(k => k + 1)
  }

  const handleChangeSuk = (action, suk) => {
    if (action === 'switch' && suk) {
      applySuk(suk)
      try { sessionStorage.setItem('activeSuk', suk.key) } catch (e) {}
      setSelectedSuk(suk)
      setAppKey(k => k + 1)
    } else {
      state.SCRIPT_URL = ''
      state.API_KEY    = ''
      state.ACTIVE_SUK = null
      db.configure({ scriptUrl: '', apiKey: '' })
      try { sessionStorage.removeItem('activeSuk') } catch (e) {}
      setSelectedSuk(null)
    }
  }

  // ── Admin SignIn overlay (shown on demand, not blocking the app) ──
  if (showSignIn) {
    return (
      <>
        <SignIn onSignIn={handleSignIn} />
        {/* Cancel button to go back without signing in */}
        <button
          onClick={() => setShowSignIn(false)}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9100,
            padding: '10px 24px', borderRadius: 20,
            border: '1px solid rgba(29,78,216,0.25)',
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
            color: '#1e3a8a', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(29,78,216,0.12)',
          }}
        >
          ← Back to App
        </button>
      </>
    )
  }

  // ── Render order: WelcomeScreen → App (no sign-in gate) ──────
  if (!selectedSuk) return (
    <WelcomeScreen
      onSelect={handleSelectSuk}
      currentUser={currentUser}
      onSignOut={handleSignOut}
      onRequestSignIn={handleRequestSignIn}
    />
  )
  return (
    <App
      key={appKey}
      onChangeSuk={handleChangeSuk}
      deepLink={deepLink}
      currentUser={currentUser}
      onSignOut={handleSignOut}
      onRequestSignIn={handleRequestSignIn}
    />
  )
}

export default AppShell
