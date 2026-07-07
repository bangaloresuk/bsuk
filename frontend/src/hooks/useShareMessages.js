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
    const timeLabel = c.time === 'Morning' ? 'Morning' : 'Evening'

    // If user pasted a maps URL inside the address field, split it out automatically
    const URL_RE = /(https?:\/\/\S+)/
    const rawPlace = c.place || ''
    const urlInPlace = rawPlace.match(URL_RE)
    const cleanPlace = urlInPlace ? rawPlace.replace(URL_RE, '').replace(/,?\s*$/, '').trim() : rawPlace.trim()
    const resolvedMaps = c.mapsLink || (urlInPlace ? urlInPlace[1] : '')
    const locationLine = cleanPlace || sukLabelFull()

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
      ...(resolvedMaps ? [`📌 *Google Maps:*`, `${resolvedMaps}`] : []),
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

  // ============================================================
  //  Per-event-type share messages — booking share button
  // ============================================================
  //  Each event type below is its OWN fully self-contained block.
  //  Edit any one of them freely without touching the others —
  //  wording, emojis, line order, whatever — nothing is shared.
  //  `c` is the booking object (has date, time, venue, mapsLink,
  //  hostedBy, mobile, occasion, day, etc).
  // ============================================================

  // ── 🪔 SATSANG ─────────────────────────────────────────────
  const buildSatsangEventMsg = (c) => {
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

  // ── 🌸 BHADRA PARIKRAMA SATSANG ────────────────────────────
  const buildBhadraEventMsg = (c) => {
    const day  = c.day || getDayName(c.date)
    const date = formatDate(c.date)
    return [
      '🙏 *Hearty Jayguru* 🙏',
      '',
      'Respected Dada / Maa,',
      '',
      'By the divine grace of',
      '*Param Premamay Sree Sree Thakur Anukulchandra*,',
      'we are humbly arranging a *Holy Bhadra Parikrama Satsang* at our residence.',
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
      'Your presence will make this Bhadra Parikrama Satsang truly blessed. 🪔',
      '',
      '*With love & Jayguru,*',
      `${c.hostedBy || sukLabelFull()}`,
      c.mobile ? `📱 ${c.mobile}` : '',
      '',
      `🙏 *${sukLabelFull()}* 🙏`,
    ].filter(l => l !== null && l !== undefined).join('\n')
  }

  // ── 🌺 MATRI-SAMMELAN ──────────────────────────────────────
  const buildMatriEventMsg = (c) => {
    const day  = c.day || getDayName(c.date)
    const date = formatDate(c.date)
    return [
      '🙏 *Hearty Jayguru* 🙏',
      '',
      'Respected Dada / Maa,',
      '',
      'By the divine grace of',
      '*Param Premamay Sree Sree Thakur Anukulchandra*,',
      'we are humbly arranging a *Holy Shravan Matrisamellan* at our residence.',
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
      'Your presence will make this Matrisamellan truly blessed. 🪔',
      '',
      '*With love & Jayguru,*',
      `${c.hostedBy || sukLabelFull()}`,
      c.mobile ? `📱 ${c.mobile}` : '',
      '',
      `🙏 *${sukLabelFull()}* 🙏`,
    ].filter(l => l !== null && l !== undefined).join('\n')
  }

  // ── 🌿 SAVAN PARIKRAMA ─────────────────────────────────────
  const buildSavanEventMsg = (c) => {
    const day  = c.day || getDayName(c.date)
    const date = formatDate(c.date)
    return [
      '🙏 *Hearty Jayguru* 🙏',
      '',
      'Respected Dada / Maa,',
      '',
      'By the divine grace of',
      '*Param Premamay Sree Sree Thakur Anukulchandra*,',
      'we are humbly arranging a *Holy Shravan Matrisamellan* at our residence.',
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
      'Your presence will make this Savan Parikrama truly blessed. 🪔',
      '',
      '*With love & Jayguru,*',
      `${c.hostedBy || sukLabelFull()}`,
      c.mobile ? `📱 ${c.mobile}` : '',
      '',
      `🙏 *${sukLabelFull()}* 🙏`,
    ].filter(l => l !== null && l !== undefined).join('\n')
  }

  // ── Dispatcher — routes to the right block above by `_type` ─
  // (this is the ONLY place that decides which block runs; the
  // blocks themselves never need to know about each other)
  const buildSatsangShareMsgPlain = (c) => {
    switch (c?._type) {
      case 'bhadra': return buildBhadraEventMsg(c)
      case 'matri':  return buildMatriEventMsg(c)
      case 'savan':  return buildSavanEventMsg(c)
      case 'satsang':
      default:       return buildSatsangEventMsg(c)
    }
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
    // satsang share (dispatcher — picks the right block by booking._type)
    buildSatsangShareMsgPlain, buildSatsangShareMsg,
    handleSatsangCopy,
    // satsang share — individual per-event-type blocks, edit these directly
    buildSatsangEventMsg, buildBhadraEventMsg, buildMatriEventMsg, buildSavanEventMsg,
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
