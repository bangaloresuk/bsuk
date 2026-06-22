// ============================================================
//  useSatsangBooking — satsang / special-event form + submit
// ============================================================
import React from 'react'
import { satsangApi, bhadraApi, matriApi, savanApi } from '../services/api.js'
import { getDayName, getTodayStr } from '../utils/utils.js'
import state from '../config/activeSuk.js'
import { sukLabel } from '../config/sukConfig.js'

export function useSatsangBooking({ isConfigured, fetchSatsangBookings, fetchBhadraBookings, fetchMatriBookings, fetchSavanBookings, satsangBookings = [], bhadraBookings = [], matriBookings = [], savanBookings = [] }) {
  const EMPTY_FORM = { name:'', mobile:'', venue:'', date:'', time:'', hostedBy:'', mapsLink:'', occasion:'' }

  const [satsangForm,       setSatsangForm]       = React.useState(EMPTY_FORM)
  const [satsangError,      setSatsangError]      = React.useState('')
  const [satsangShake,      setSatsangShake]      = React.useState(false)
  const [satsangSubmitting, setSatsangSubmitting] = React.useState(false)
  const [satsangConfirm,    setSatsangConfirm]    = React.useState(null)
  const [satsangMode,       setSatsangMode]       = React.useState('book') // 'book' | 'invite' | 'message'
  const [satsangCalDate,    setSatsangCalDate]    = React.useState(() => {
    const t = new Date(); t.setHours(0,0,0,0)
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`
  })

  const triggerSatsangError = (msg) => {
    setSatsangError(msg); setSatsangShake(true)
    setTimeout(() => setSatsangShake(false), 600)
  }

  // ── Submit satsang booking ────────────────────────────────
  const handleSatsangSubmit = async () => {
    const { name, mobile, venue, date, time } = satsangForm
    if (!name.trim())   { triggerSatsangError('⚠️ Please enter the host\'s name.'); return }
    if (!mobile.trim()) { triggerSatsangError('⚠️ Please enter the mobile number.'); return }
    if (!/^[0-9]{10}$/.test(mobile.trim())) { triggerSatsangError('⚠️ Valid 10-digit mobile required.'); return }
    if (!date)          { triggerSatsangError('⚠️ Please select a date.'); return }
    if (date < getTodayStr()) { triggerSatsangError('⚠️ Please select today or a future date.'); return }
    if (!time.trim())   { triggerSatsangError('⚠️ Please enter the time.'); return }
    if (!venue.trim())  { triggerSatsangError('⚠️ Please enter the venue.'); return }
    if (!isConfigured)  { triggerSatsangError('⚠️ Please configure the Satsang Script URL.'); return }

    const dupBooking = satsangBookings.find(b => b.date === date && b.time.trim().toLowerCase() === time.trim().toLowerCase())
    if (dupBooking) {
      triggerSatsangError(`⚠️ This date & time is already booked by ${dupBooking.name || 'someone'}. Please select a different time.`)
      return
    }

    const mobileDup = satsangBookings.find(b => b.date === date && b.mobile.trim() === mobile.trim())
    if (mobileDup) {
      triggerSatsangError(`⚠️ This mobile number has already booked a Satsang on this date. Only one booking per person per date is allowed.`)
      return
    }

    setSatsangSubmitting(true)
    try {
      const result = await satsangApi.post({
        action: 'add',
        name: name.trim(),
        mobile: mobile.trim(),
        venue: venue.trim(),
        date,
        time: time.trim(),
        hostedBy: satsangForm.hostedBy.trim() || (state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK) : 'SUK'),
        mapsLink: satsangForm.mapsLink.trim(),
        occasion: satsangForm.occasion.trim(),
        day: getDayName(date),
      })
      if (result.success) {
        setSatsangConfirm({ ...satsangForm, id: result.id, day: getDayName(date) })
        setSatsangForm(EMPTY_FORM)
        fetchSatsangBookings()
      } else {
        triggerSatsangError(result.message || '⚠️ Booking failed. Please try again.')
      }
    } catch (e) {
      triggerSatsangError('⚠️ Network error. Please try again.')
    }
    setSatsangSubmitting(false)
  }

  // ── Submit special event (bhadra / matri / savan) ─────────
  const handleSpecialSubmit = async (bookMode, SPECIAL_INFO) => {
    const { name, mobile, venue, date, time } = satsangForm
    const t = SPECIAL_INFO[bookMode]
    if (!t) return
    if (!name.trim())   { triggerSatsangError('⚠️ Please enter the host\'s name.'); return }
    if (!mobile.trim()) { triggerSatsangError('⚠️ Please enter the mobile number.'); return }
    if (!/^[0-9]{10}$/.test(mobile.trim())) { triggerSatsangError('⚠️ Valid 10-digit mobile required.'); return }
    if (!date)          { triggerSatsangError('⚠️ Please select a date.'); return }
    if (date < getTodayStr()) { triggerSatsangError('⚠️ Please select today or a future date.'); return }
    if (!time.trim())   { triggerSatsangError('⚠️ Please enter the time.'); return }
    if (!venue.trim())  { triggerSatsangError('⚠️ Please enter the venue.'); return }
    if (!isConfigured)  { triggerSatsangError('⚠️ Please configure the Script URL.'); return }

    const specialBookingsMap = { bhadra: bhadraBookings, matri: matriBookings, savan: savanBookings }
    const existingForType = specialBookingsMap[bookMode] || []
    const dupBooking = existingForType.find(b => b.date === date && b.time.trim().toLowerCase() === time.trim().toLowerCase())
    if (dupBooking) {
      triggerSatsangError(`⚠️ This date & time is already booked by ${dupBooking.name || 'someone'} for ${t.label}. Please select a different time.`)
      return
    }

    const mobileDup = existingForType.find(b => b.date === date && b.mobile.trim() === mobile.trim())
    if (mobileDup) {
      triggerSatsangError(`⚠️ This mobile number has already booked ${t.label} on this date. Only one booking per person per date is allowed.`)
      return
    }

    setSatsangSubmitting(true)
    try {
      const result = await t.api.post({
        action: 'add',
        name: name.trim(), mobile: mobile.trim(), venue: venue.trim(),
        date, time: time.trim(),
        hostedBy: satsangForm.hostedBy.trim() || (state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK) : 'SUK'),
        mapsLink: satsangForm.mapsLink.trim(),
        occasion: satsangForm.occasion.trim(),
        day: getDayName(date),
      })
      if (result.success) {
        setSatsangConfirm({ ...satsangForm, id: result.id, day: getDayName(date), _type: bookMode })
        setSatsangForm(EMPTY_FORM)
        t.fetch()
      } else {
        triggerSatsangError(result.message || '⚠️ Booking failed. Please try again.')
      }
    } catch (e) {
      triggerSatsangError('⚠️ Network error. Please try again.')
    }
    setSatsangSubmitting(false)
  }

  return {
    satsangForm, setSatsangForm,
    satsangError, setSatsangError,
    satsangShake,
    satsangSubmitting,
    satsangConfirm, setSatsangConfirm,
    satsangMode, setSatsangMode,
    satsangCalDate, setSatsangCalDate,
    triggerSatsangError,
    handleSatsangSubmit,
    handleSpecialSubmit,
  }
}
