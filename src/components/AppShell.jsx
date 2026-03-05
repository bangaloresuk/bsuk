// ============================================================
//  AppShell — Root component
//  ─────────────────────────────────────────────────────────
//  Responsibilities:
//  • Reads SUK from URL deep-link or sessionStorage on load
//  • Shows WelcomeScreen until a SUK is selected
//  • Calls db.configure() with SUK credentials whenever SUK changes
//    (this is the ONLY place credentials are set — nowhere else)
//  • Mounts App with a key so it fully remounts on SUK switch
// ============================================================

import React from 'react'
import { SUK_CONFIG } from '../config/sukConfig.js'
import state from '../config/activeSuk.js'
import db from '../db/index.js'
import App from './App.jsx'
import WelcomeScreen from './welcome/WelcomeScreen.jsx'

// ── Internal: apply a SUK — sets both legacy state + db layer ─
function applySuk(suk) {
  state.SCRIPT_URL = suk.scriptUrl || ''
  state.API_KEY    = suk.apiKey    || ''
  state.ACTIVE_SUK = suk
  db.configure({ scriptUrl: suk.scriptUrl || '', apiKey: suk.apiKey || '' })
}

function AppShell() {
  const deepLink = React.useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search)
      return { suk: p.get('suk'), open: p.get('open') }
    } catch (e) { return {} }
  }, [])

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

  if (!selectedSuk) return <WelcomeScreen onSelect={handleSelectSuk} />
  return <App key={appKey} onChangeSuk={handleChangeSuk} deepLink={deepLink} />
}

export default AppShell
