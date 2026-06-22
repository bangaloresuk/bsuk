// ============================================================
//  useBookings — owns all booking data + cancel/update logic
//  for prayer, satsang, bhadra, matri, savan
// ============================================================
import React from 'react'
import { api, satsangApi, bhadraApi, matriApi, savanApi } from '../services/api.js'

export function useBookings({ isConfigured, feat }) {
  // ── Raw data ─────────────────────────────────────────────
  const [bookings,       setBookings]       = React.useState([])
  const [satsangBookings,setSatsangBookings]= React.useState([])
  const [bhadraBookings, setBhadraBookings] = React.useState([])
  const [matriBookings,  setMatriBookings]  = React.useState([])
  const [savanBookings,  setSavanBookings]  = React.useState([])

  // ── Loading flags ─────────────────────────────────────────
  const [bookingsReady,  setBookingsReady]  = React.useState(false)
  const [satsangReady,   setSatsangReady]   = React.useState(false)

  const dataReady = !isConfigured || (bookingsReady && satsangReady)

  // ── Cancel / share UI state ───────────────────────────────
  const [cancelling,      setCancelling]      = React.useState(null)
  const [cancelMobile,    setCancelMobile]    = React.useState('')
  const [cancelResults,   setCancelResults]   = React.useState(null)
  const [cancelMsg,       setCancelMsg]       = React.useState('')
  const [showCancelPast,  setShowCancelPast]  = React.useState(false)

  const [shareMobile,        setShareMobile]        = React.useState('')
  const [shareResults,       setShareResults]        = React.useState(null)
  const [shareMsg,           setShareMsg]            = React.useState('')
  const [retrieveTypeFilter, setRetrieveTypeFilter]  = React.useState('prayer')
  const [showRetrievePast,   setShowRetrievePast]    = React.useState(false)

  // ── Address edit state ────────────────────────────────────
  const [editingAddress, setEditingAddress] = React.useState(null)
  const [editAddressVal, setEditAddressVal] = React.useState('')
  const [editMapsVal,    setEditMapsVal]    = React.useState('')
  const [savingAddress,  setSavingAddress]  = React.useState(false)
  const [addressMsg,     setAddressMsg]     = React.useState({})

  // ── Fetchers ──────────────────────────────────────────────
  const fetchBookings = React.useCallback(async () => {
    if (!isConfigured) { setBookingsReady(true); return }
    setBookingsReady(false)
    try {
      const d = await api.getAll()
      if (d.success && Array.isArray(d.data)) setBookings(d.data)
      else if (Array.isArray(d)) setBookings(d)
    } catch (e) { console.error('fetchBookings error:', e) }
    setBookingsReady(true)
  }, [isConfigured])

  const fetchSatsangBookings = React.useCallback(async () => {
    if (!isConfigured) { setSatsangReady(true); return }
    setSatsangReady(false)
    try {
      const d = await satsangApi.getAll()
      if (d.success && Array.isArray(d.data)) setSatsangBookings(d.data)
      else if (Array.isArray(d)) setSatsangBookings(d)
    } catch (e) { console.error('fetchSatsang error:', e) }
    setSatsangReady(true)
  }, [isConfigured])

  const fetchBhadraBookings = React.useCallback(async () => {
    if (!isConfigured || !feat.bhadraBooking) return
    try {
      const d = await bhadraApi.getAll()
      if (d.success && Array.isArray(d.data)) setBhadraBookings(d.data)
      else if (Array.isArray(d)) setBhadraBookings(d)
    } catch (e) { console.error('fetchBhadra error:', e) }
  }, [isConfigured, feat.bhadraBooking])

  const fetchMatriBookings = React.useCallback(async () => {
    if (!isConfigured || !feat.matriBooking) return
    try {
      const d = await matriApi.getAll()
      if (d.success && Array.isArray(d.data)) setMatriBookings(d.data)
      else if (Array.isArray(d)) setMatriBookings(d)
    } catch (e) { console.error('fetchMatri error:', e) }
  }, [isConfigured, feat.matriBooking])

  const fetchSavanBookings = React.useCallback(async () => {
    if (!isConfigured || !feat.savanBooking) return
    try {
      const d = await savanApi.getAll()
      if (d.success && Array.isArray(d.data)) setSavanBookings(d.data)
      else if (Array.isArray(d)) setSavanBookings(d)
    } catch (e) { console.error('fetchSavan error:', e) }
  }, [isConfigured, feat.savanBooking])

  React.useEffect(() => { fetchBookings() },       [fetchBookings])
  React.useEffect(() => { fetchSatsangBookings() }, [fetchSatsangBookings])
  React.useEffect(() => { fetchBhadraBookings() },  [fetchBhadraBookings])
  React.useEffect(() => { fetchMatriBookings() },   [fetchMatriBookings])
  React.useEffect(() => { fetchSavanBookings() },   [fetchSavanBookings])

  // ── Cancel prayer booking ─────────────────────────────────
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    setCancelling(id)
    try {
      const result = await api.delete(id)
      if (result.success) {
        setCancelResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev)
        setShareResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev)
        setBookings(prev => prev.filter(b => b.id !== id))
        setBookingsReady(false)
        const msg = '✅ Booking cancelled successfully.'
        setCancelMsg(msg); setShareMsg(msg)
        await fetchBookings()
      } else {
        const msg = '❌ Could not cancel. Please try again.'
        setCancelMsg(msg); setShareMsg(msg)
      }
    } catch (e) {
      const msg = '❌ Could not cancel: ' + (e?.message || 'Please try again.')
      setCancelMsg(msg); setShareMsg(msg)
    }
    setCancelling(null)
  }

  // ── Cancel satsang booking ────────────────────────────────
  const handleCancelSatsang = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this Satsang booking?')) return
    setCancelling(id)
    try {
      const result = await satsangApi.cancel(id)
      if (result.success) {
        setCancelResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev)
        setShareResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev)
        setSatsangBookings(prev => prev.filter(b => b.id !== id))
        setSatsangReady(false)
        const msg = '✅ Satsang cancelled successfully.'
        setCancelMsg(msg); setShareMsg(msg)
        await fetchSatsangBookings()
      } else {
        const msg = '❌ Could not cancel: ' + (result.message || 'Please try again.')
        setCancelMsg(msg); setShareMsg(msg)
      }
    } catch (e) {
      const msg = '❌ Could not cancel: ' + (e?.message || 'Please try again.')
      setCancelMsg(msg); setShareMsg(msg)
    }
    setCancelling(null)
  }

  // ── Cancel bhadra / matri / savan ─────────────────────────
  const handleCancelSpecial = async (id, _type) => {
    const LABEL = { satsang:'Satsang', bhadra:'Bhadra Parikrama', matri:'Matri-Sammelan', savan:'Savan Parikrama' }
    const API   = { satsang:satsangApi, bhadra:bhadraApi, matri:matriApi, savan:savanApi }
    const FETCH = { satsang:fetchSatsangBookings, bhadra:fetchBhadraBookings, matri:fetchMatriBookings, savan:fetchSavanBookings }
    const SET   = {
      satsang: v => setSatsangBookings(v),
      bhadra:  v => setBhadraBookings(v),
      matri:   v => setMatriBookings(v),
      savan:   v => setSavanBookings(v),
    }
    const label = LABEL[_type] || 'booking'
    const apiRef   = API[_type]   || satsangApi
    const fetchRef = FETCH[_type] || fetchSatsangBookings
    const setFn    = SET[_type]
    if (!window.confirm(`Are you sure you want to cancel this ${label} booking?`)) return
    setCancelling(id)
    try {
      const result = await apiRef.cancel(id)
      if (result.success) {
        if (setFn) setFn(prev => prev.filter(b => b.id !== id))
        setShareResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev)
        const msg = `✅ ${label} cancelled successfully.`
        setCancelMsg(msg); setShareMsg(msg)
        await fetchRef()
      } else {
        const msg = '❌ Could not cancel: ' + (result.message || 'Please try again.')
        setCancelMsg(msg); setShareMsg(msg)
      }
    } catch (e) {
      const msg = '❌ Could not cancel: ' + (e?.message || 'Please try again.')
      setCancelMsg(msg); setShareMsg(msg)
    }
    setCancelling(null)
  }

  // ── Cancel lookup ─────────────────────────────────────────
  const handleCancelLookup = async () => {
    setCancelMsg(''); setCancelResults(null)
    if (!/^[0-9]{10}$/.test(cancelMobile.trim())) {
      setCancelMsg('⚠️ Please enter a valid 10-digit mobile number.')
      return
    }
    const mob = cancelMobile.trim()
    setBookingsReady(false); setSatsangReady(false)
    try {
      const fetches = [api.getAll(), satsangApi.getAll()]
      if (feat.bhadraBooking) fetches.push(bhadraApi.getAll())
      if (feat.matriBooking)  fetches.push(matriApi.getAll())
      if (feat.savanBooking)  fetches.push(savanApi.getAll())
      const results = await Promise.all(fetches)
      const [bd, sd] = results
      const freshBookings = (bd?.success && Array.isArray(bd.data)) ? bd.data : []
      const freshSatsang  = (sd?.success && Array.isArray(sd.data)) ? sd.data : []
      let idx = 2
      const freshBhadra = feat.bhadraBooking && results[idx] ? ((results[idx].success && Array.isArray(results[idx].data)) ? results[idx++].data : (idx++, [])) : []
      const freshMatri  = feat.matriBooking  && results[idx] ? ((results[idx].success && Array.isArray(results[idx].data)) ? results[idx++].data : (idx++, [])) : []
      const freshSavan  = feat.savanBooking  && results[idx] ? ((results[idx].success && Array.isArray(results[idx].data)) ? results[idx].data : []) : []
      setBookings(freshBookings)
      setSatsangBookings(freshSatsang)
      if (freshBhadra.length) setBhadraBookings(freshBhadra)
      if (freshMatri.length)  setMatriBookings(freshMatri)
      if (freshSavan.length)  setSavanBookings(freshSavan)
      const combined = [
        ...freshBookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:'prayer' })),
        ...freshSatsang.filter(b => b.mobile === mob).map(b => ({ ...b, _type:'satsang' })),
        ...freshBhadra.filter(b => b.mobile === mob).map(b => ({ ...b, _type:'bhadra' })),
        ...freshMatri.filter(b => b.mobile === mob).map(b => ({ ...b, _type:'matri' })),
        ...freshSavan.filter(b => b.mobile === mob).map(b => ({ ...b, _type:'savan' })),
      ].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      if (combined.length === 0) {
        setCancelMsg('❌ No bookings found for this mobile number.')
        setCancelResults([])
      } else {
        setCancelResults(combined)
      }
    } catch (e) {
      setCancelMsg('❌ Network error. Please try again.')
    } finally {
      setBookingsReady(true); setSatsangReady(true)
    }
  }

  // ── Share / retrieve lookup ───────────────────────────────
  const handleShareLookup = () => {
    setShareMsg(''); setShareResults(null)
    if (!/^[0-9]{10}$/.test(shareMobile.trim())) {
      setShareMsg('⚠️ Please enter a valid 10-digit mobile number.')
      return
    }
    const mob = shareMobile.trim()
    const allFound = [
      ...bookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:'prayer' })),
      ...satsangBookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:'satsang' })),
      ...(feat.bhadraBooking ? bhadraBookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:'bhadra' })) : []),
      ...(feat.matriBooking  ? matriBookings.filter(b  => b.mobile === mob).map(b => ({ ...b, _type:'matri'  })) : []),
      ...(feat.savanBooking  ? savanBookings.filter(b  => b.mobile === mob).map(b => ({ ...b, _type:'savan'  })) : []),
    ]
    const combined = (retrieveTypeFilter === 'all' ? allFound : allFound.filter(b => b._type === retrieveTypeFilter))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    if (combined.length === 0) {
      setShareMsg('❌ No bookings found for this mobile number.')
      setShareResults([])
    } else {
      setShareResults(combined)
    }
  }

  // ── Update address ────────────────────────────────────────
  const handleUpdateAddress = async (bookingId, newAddress, newMapsLink) => {
    setSavingAddress(true)
    try {
      const parts = [newAddress.trim(), (newMapsLink || '').trim()].filter(Boolean)
      const combined = parts.join('  ')
      const result = await api.update(bookingId, combined)
      if (result.success) {
        setShareResults(prev => prev.map(b => b.id === bookingId ? { ...b, place: combined } : b))
        setAddressMsg(prev => ({ ...prev, [bookingId]: 'Address updated!' }))
        setEditingAddress(null); setEditAddressVal(''); setEditMapsVal('')
        fetchBookings()
        setTimeout(() => setAddressMsg(prev => { const n = { ...prev }; delete n[bookingId]; return n }), 3000)
      } else {
        setAddressMsg(prev => ({ ...prev, [bookingId]: 'Error: ' + (result.message || 'Update failed') }))
      }
    } catch (e) {
      setAddressMsg(prev => ({ ...prev, [bookingId]: 'Network error. Please try again.' }))
    }
    setSavingAddress(false)
  }

  return {
    // data
    bookings, satsangBookings, bhadraBookings, matriBookings, savanBookings,
    // loading
    dataReady, bookingsReady, satsangReady,
    // cancel
    cancelling, cancelMobile, setCancelMobile,
    cancelResults, setCancelResults,
    cancelMsg, setCancelMsg,
    showCancelPast, setShowCancelPast,
    handleCancelLookup, handleCancelBooking, handleCancelSatsang, handleCancelSpecial,
    // retrieve/share
    shareMobile, setShareMobile,
    shareResults, setShareResults,
    shareMsg, setShareMsg,
    retrieveTypeFilter, setRetrieveTypeFilter,
    showRetrievePast, setShowRetrievePast,
    handleShareLookup,
    // address edit
    editingAddress, setEditingAddress,
    editAddressVal, setEditAddressVal,
    editMapsVal, setEditMapsVal,
    savingAddress, addressMsg,
    handleUpdateAddress,
    // fetchers (exported so tabs can trigger refresh)
    fetchBookings, fetchSatsangBookings, fetchBhadraBookings, fetchMatriBookings, fetchSavanBookings,
  }
}
