// ============================================================
//  usePrayerBooking — prayer form state + submit handler
// ============================================================
import React from 'react'
import { api } from '../services/api.js'
import { getPrayerTimes } from '../config/prayerTimes.js'
import { getDayName, getTodayStr } from '../utils/utils.js'
import state from '../config/activeSuk.js'

export function usePrayerBooking({ isConfigured, bookings, fetchBookings }) {
  const [form, setForm] = React.useState({ name:'', mobile:'', place:'', time:'', date:'', mapsLink:'' })
  const [error,       setError]       = React.useState('')
  const [shake,       setShake]       = React.useState(false)
  const [submitting,  setSubmitting]  = React.useState(false)
  const [confirmation,setConfirmation]= React.useState(null)

  const triggerError = (msg) => {
    setError(msg); setShake(true)
    setTimeout(() => setShake(false), 450)
  }

  const isSlotTaken    = (date, time) => bookings.some(b => b.date === date && b.time === time)
  const getSlotBooking = (date, time) => bookings.find(b => b.date === date && b.time === time)

  const handleSlotSelect = (time) => {
    if (form.date && isSlotTaken(form.date, time)) {
      const ex = getSlotBooking(form.date, time)
      triggerError(`🚫 "${time} Prayer" on this date is already booked by ${ex.name}.\n\nPlease choose a different date or slot.`)
      return
    }
    setError('')
    setForm(f => ({ ...f, time }))
  }

  const handleBook = async () => {
    setError('')
    const { name, mobile, place, time, date } = form
    if (!name.trim())   { triggerError('⚠️ Please enter the person\'s name.'); return }
    if (!mobile.trim()) { triggerError('⚠️ Please enter the mobile number.'); return }
    if (!/^[0-9]{10}$/.test(mobile.trim())) { triggerError('⚠️ Please enter a valid 10-digit mobile number.'); return }
    if (!place.trim())  { triggerError('⚠️ Please enter your location name.'); return }
    if (!date)          { triggerError('⚠️ Please select a date.'); return }
    if (date < getTodayStr()) { triggerError('⚠️ You cannot book a past date. Please select today or a future date.'); return }
    if (!time)          { triggerError('⚠️ Please select Morning or Evening slot.'); return }
    if (isSlotTaken(date, time)) {
      const ex = getSlotBooking(date, time)
      triggerError(`🚫 "${time} Prayer" on this date is already booked by ${ex.name}.\n\nPlease choose a different date or slot.`)
      return
    }
    if (!isConfigured) { triggerError('⚠️ Please add your Google Apps Script URL first.'); return }

    const day        = getDayName(date)
    const pt         = getPrayerTimes(date)
    const prayerTime = pt ? pt[time] : ''
    const mapsLink   = form.mapsLink || ''

    setSubmitting(true)
    try {
      const result = await api.post({ action:'add', name, mobile, place, mapsLink, day, time, date, prayerTime })
      if (result.success) {
        setConfirmation({ name, mobile, time, date, prayerTime, id: result.id, place, mapsLink })
        setForm({ name:'', mobile:'', place:'', time:'', date:'', mapsLink:'' })
        fetchBookings()
      } else {
        triggerError(result.message || '⚠️ Booking failed. Please try again.')
      }
    } catch (e) {
      triggerError('⚠️ Network error. Please try again.')
    }
    setSubmitting(false)
  }

  return {
    form, setForm,
    error, shake,
    submitting,
    confirmation, setConfirmation,
    triggerError,
    isSlotTaken, getSlotBooking,
    handleSlotSelect, handleBook,
  }
}
