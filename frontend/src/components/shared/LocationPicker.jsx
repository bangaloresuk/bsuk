// ============================================================
//  LocationPicker — GPS + place-search helper
//  Two ways to fill address + Google Maps link (India-only):
//   1. GPS — browser geolocation + backend reverse-geocode
//   2. Search box — backend Places Autocomplete dropdown
// ============================================================
import React from 'react'
import { locationApi } from '../../services/api.js'

export function LocationPicker({ onPick, color = '#1d4ed8', placeholder = 'Search for a place, area or landmark…' }) {
  const [query,       setQuery]       = React.useState('')
  const [results,     setResults]     = React.useState([])
  const [searching,   setSearching]   = React.useState(false)
  const [locating,    setLocating]    = React.useState(false)
  const [showResults, setShowResults] = React.useState(false)
  const debounceRef = React.useRef(null)

  const doSearch = async (q) => {
    if (!q || q.trim().length < 3) { setResults([]); return }
    setSearching(true)
    try {
      const resp = await locationApi.search(q.trim())
      setResults(resp.success && Array.isArray(resp.data) ? resp.data : [])
      setShowResults(true)
    } catch (e) { setResults([]) }
    setSearching(false)
  }

  const handleQueryChange = (v) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 500)
  }

  const pickResult = async (r) => {
    setQuery(r.display_name)
    setResults([]); setShowResults(false)
    try {
      const resp = await locationApi.place(r.placeId)
      const d = resp.success ? resp.data : null
      onPick({
        address:  d?.address || r.display_name,
        mapsLink: (d?.lat != null && d?.lon != null)
          ? `https://maps.google.com/?q=${d.lat},${d.lon}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.display_name)}`,
      })
    } catch (e) {
      onPick({
        address:  r.display_name,
        mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.display_name)}`,
      })
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { alert("Your browser doesn't support location access."); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`
        let address = ''
        try {
          const resp = await locationApi.reverse(latitude, longitude)
          address = resp.success ? (resp.data?.address || '') : ''
        } catch (e) { /* ignore */ }
        onPick({ address, mapsLink })
        setLocating(false)
      },
      (err) => {
        alert("Couldn't get your location: " + (err.message || 'Permission denied.'))
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div style={{ position:'relative' }}>
      <div style={{ display:'flex', gap:8 }}>
        <div style={{ flex:1, position:'relative' }}>
          <input className="divine-input" placeholder={placeholder}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => { if (results.length) setShowResults(true) }}
            style={{ borderColor:`${color}33`, paddingRight:34 }}/>
          {searching && (
            <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
              fontSize:13, color:`${color}99` }}>⏳</span>
          )}
          {showResults && results.length > 0 && (
            <div style={{
              position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:50,
              background:'#fff', border:`1px solid ${color}33`, borderRadius:10,
              boxShadow:'0 8px 24px rgba(0,0,0,0.12)', overflow:'hidden', maxHeight:220, overflowY:'auto',
            }}>
              {results.map((r, i) => (
                <div key={i} onClick={() => pickResult(r)}
                  style={{ padding:'9px 12px', fontSize:12, cursor:'pointer',
                    borderBottom: i < results.length - 1 ? '1px solid #f0f0f0' : 'none', color:'#374151' }}
                  onMouseDown={e => e.preventDefault()}>
                  📍 {r.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={useCurrentLocation} disabled={locating}
          title="Use my current location"
          style={{
            flexShrink:0, padding:'0 14px', borderRadius:10, border:`1px solid ${color}33`,
            background: locating ? '#f3f4f6' : `${color}10`, color, fontWeight:700, fontSize:12,
            cursor: locating ? 'not-allowed' : 'pointer', whiteSpace:'nowrap',
          }}>
          {locating ? '⏳' : '📍'} {locating ? 'Locating…' : 'My location'}
        </button>
      </div>
      <div style={{ fontSize:10, color:'rgba(0,0,0,0.35)', marginTop:4 }}>
        Search a place above, or tap "My location" to use your phone's GPS — both fill the address and maps link below.
      </div>
    </div>
  )
}
