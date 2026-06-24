// ============================================================
//  useShareMessages — builds prayer / satsang share messages
//  and provides WA / SMS / clipboard helpers
// ============================================================
import React from 'react'
import state from '../config/activeSuk.js'
import { sukLabel } from '../config/sukConfig.js'
import { formatDate, formatDateWithDay, getDayName, cleanTime } from '../utils/utils.js'

export function useShareMessages() {
  // ── Message creator state (MessagesTab) ───────────────────
  const [msgType,   setMsgType]   = React.useState('')
  const [satsang,   setSatsang]   = React.useState({ date:'', time:'', venue:'', mapsLink:'', hostedBy:'' })
  const [customMsg, setCustomMsg] = React.useState({ body:'', author:'' })
  const [jajan,     setJajan]     = React.useState({ name:'', place:'', date:'', experience:'', link:'' })
  const [msgPreview,setMsgPreview]= React.useState('')

  // ── Active SUK label helper ───────────────────────────────
  const sukLabelFull = () =>
    state.ACTIVE_SUK
      ? sukLabel(state.ACTIVE_SUK) + (state.ACTIVE_SUK.location ? ', ' + state.ACTIVE_SUK.location : '')
      : 'Satsang Upayojana Kendra'

  // ── Prayer booking share message ──────────────────────────
  const buildShareMsgPlain = (c) => {
    const timeLabel    = c.time === 'Morning' ? 'Morning' : 'Evening'
    const locationLine = c.place || sukLabelFull()
    return [
      'Jayguru 🙏',
      '',
      "You're cordially invited! 🙏",
      '',
      `for the *${timeLabel} Prayer*`,
      `on *${formatDateWithDay(c.date)}* at *${cleanTime(c.prayerTime)}*`,
      '',
      'Please join us with your family and friends 🙏',
      '',
      '━━━━━━━━━━━━━━━━━━━━',
      `🕐 *Prayer Time:* ${cleanTime(c.prayerTime)} sharp`,
      '',
      `📍 *Address:*`,
      `${locationLine}`,
      '',
      ...(c.mapsLink ? [`📌 *Google Maps:*`, `${c.mapsLink}`] : []),
      '━━━━━━━━━━━━━━━━━━━━',
      '',
      '*With love & Jayguru,*',
      `${c.name} 🙏`,
      `📱 ${c.mobile}`,
      '',
      `🙏 *${sukLabelFull()}*`,
    ].join('\n')
  }
  const buildShareMsg = (c) => encodeURIComponent(buildShareMsgPlain(c))

  // ── Satsang share message ─────────────────────────────────
  const buildSatsangShareMsgPlain = (c) => {
    const day  = c.day || getDayName(c.date)
    const date = formatDate(c.date)
    return [
      '🙏 *Hearty Jayguru* 🙏',
      '',
      'Respected Dada / Maa,',
      '',
      'By the divine grace of',
      '*Param Premamay Sree Sree Thakur Anukulchandra*,',
      'we are humbly arranging a *Holy Satsang* at our residence.',
      c.occasion ? `\n🪔 *Occasion:* ${c.occasion}` : '',
      '',
      '━━━━━━━━━━━━━━━━━━━━',
      '📅 *Date & Time*',
      `      ${day}, ${date}  |  ${c.time} onwards`,
      '',
      '📍 *Venue*',
      `      ${c.venue}`,
      c.mapsLink ? `      📌 ${c.mapsLink}` : '',
      '━━━━━━━━━━━━━━━━━━━━',
      '',
      'We most cordially request your divine presence',
      'along with your *family and friends*. 🌸',
      '',
      'Your presence will make this Satsang truly blessed. 🪔',
      '',
      '*With love & Jayguru,*',
      `${c.hostedBy || sukLabelFull()}`,
      c.mobile ? `📱 ${c.mobile}` : '',
      '',
      `🙏 *${sukLabelFull()}* 🙏`,
    ].filter(l => l !== null && l !== undefined).join('\n')
  }
  const buildSatsangShareMsg = (c) => encodeURIComponent(buildSatsangShareMsgPlain(c))

  // ── Message creator builders ──────────────────────────────
  const buildSatsangMsg = () => {
    const { date, time, venue, mapsLink, hostedBy } = satsang
    const lines = [
      '🙏 *Hearty Jayguru* 🙏', '',
      'Respected Dada / Maa,', '',
      'By the divine grace of',
      '*Param Premamay Sree Sree Thakur Anukulchandra*,',
      'we are humbly arranging a *Holy Satsang* at our residence.',
      '', '━━━━━━━━━━━━━━━━━━━━', '📅 *Date & Time*',
    ]
    if (date) lines.push(`      ${date}${time ? '  |  ' + time + ' onwards' : ''}`)
    lines.push('', '📍 *Venue*')
    if (venue)    lines.push(`      ${venue}`)
    if (mapsLink) lines.push(`      📌 ${mapsLink}`)
    lines.push('━━━━━━━━━━━━━━━━━━━━', '',
      'We most cordially request your divine presence',
      'along with your *family and friends*. 🌸', '',
      'Your presence will make this Satsang truly blessed. 🪷', '')
    if (hostedBy) { lines.push('*With love & Jayguru,*'); lines.push(hostedBy) }
    lines.push('', `🙏 *${sukLabelFull()}* 🙏`)
    return lines.join('\n')
  }

  const buildCustomMsg = () => {
    const lines = ['🙏 *Hearty Jayguru* 🙏', '', customMsg.body.trim(), '', '━━━━━━━━━━━━━━━━━━━━']
    if (customMsg.author.trim()) lines.push(`*${customMsg.author.trim()}*`)
    lines.push(`🙏 *${sukLabelFull()}* 🙏`)
    return lines.join('\n')
  }

  const buildJajanMsg = () => {
    const { name, place, date, experience } = jajan
    return [
      'Jayguru 🙏', '', '🌸 *Jajan Experience*', '', experience.trim(), '',
      jajan.link.trim() ? `🔗 ${jajan.link.trim()}` : '',
      name.trim()  ? `— ${name.trim()}`  : '',
      place.trim() ? `📍 ${place.trim()}` : '',
      date ? `📅 ${getDayName(date)}, ${formatDate(date)}` : '',
      '', '─────────────────',
      `🙏 ${sukLabelFull()}`,
    ].filter((l, i, arr) => !(l === '' && arr[i-1] === '')).join('\n')
  }

  const getBuiltMsg = () => msgType === 'satsang' ? buildSatsangMsg() : buildCustomMsg()

  // ── Share / clipboard helpers ─────────────────────────────
  const shareWhatsApp = (msg) => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  const shareSMS      = (msg) => window.open(`sms:?body=${encodeURIComponent(msg)}`)
  const shareCopy     = (msg) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg)
        .then(() => alert('✅ Copied! Paste it anywhere.'))
        .catch(() => prompt('Copy:', msg))
    } else { prompt('Copy:', msg) }
  }

  const handleCopy = (c) => {
    const msg = buildShareMsgPlain(c)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg)
        .then(() => alert('✅ Copied! Paste it in WhatsApp, SMS or anywhere.'))
        .catch(() => prompt('Copy this message:', msg))
    } else { prompt('Copy this message:', msg) }
  }

  const handleSatsangCopy = (c) => {
    const msg = buildSatsangShareMsgPlain(c)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg)
        .then(() => alert('✅ Copied! Paste it in WhatsApp, SMS or anywhere.'))
        .catch(() => prompt('Copy this message:', msg))
    } else { prompt('Copy this message:', msg) }
  }

  return {
    // prayer share
    buildShareMsgPlain, buildShareMsg,
    handleCopy,
    // satsang share
    buildSatsangShareMsgPlain, buildSatsangShareMsg,
    handleSatsangCopy,
    // message creator
    msgType, setMsgType,
    satsang, setSatsang,
    customMsg, setCustomMsg,
    jajan, setJajan,
    msgPreview, setMsgPreview,
    buildSatsangMsg, buildCustomMsg, buildJajanMsg, getBuiltMsg,
    // share actions
    shareWhatsApp, shareSMS, shareCopy,
  }
}
