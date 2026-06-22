// ============================================================
//  EventDateChips — scrollable date-chip picker with live
//  availability counts from a booking list
// ============================================================
import React from 'react'

export function EventDateChips({ bookings = [], value, onChange, color = '#1d4ed8', idPrefix = 'evChips', days = 14 }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const chips = []
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i)
    const y  = d.getFullYear()
    const m  = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${dd}`
    const count   = bookings.filter(b => b.date === dateStr).length
    const sel     = value === dateStr
    chips.push(
      <button key={dateStr} type="button"
        onClick={() => onChange(dateStr)}
        style={{
          display:'flex', flexDirection:'column', alignItems:'center',
          padding:'8px 6px', borderRadius:12, flexShrink:0,
          border:`2px solid ${sel ? color : count > 0 ? '#fcd34d' : 'rgba(59,130,246,0.18)'}`,
          background: sel ? color : count > 0 ? '#fef3c7' : '#f0f9ff',
          cursor:'pointer', minWidth:54, transition:'all 0.15s',
          boxShadow: sel ? `0 3px 12px ${color}55` : 'none',
        }}>
        <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase',
          color: sel ? 'rgba(255,255,255,0.8)' : '#6b7280', letterSpacing:'0.5px' }}>
          {i === 0 ? 'Today' : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}
        </div>
        <div style={{ fontSize:16, fontWeight:900, marginTop:2,
          color: sel ? '#fff' : '#1e3a8a' }}>{dd}</div>
        <div style={{ fontSize:8, marginTop:3, fontWeight:800, whiteSpace:'nowrap',
          color: sel ? 'rgba(255,255,255,0.9)' : count > 0 ? '#d97706' : '#16a34a' }}>
          {count > 0 ? `${count} BOOKED` : 'FREE'}
        </div>
        <div style={{ display:'flex', gap:2, marginTop:4 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background: count > 0 ? '#f59e0b' : '#22c55e' }}/>
        </div>
      </button>
    )
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <button type="button"
        onClick={() => { const el = document.getElementById(idPrefix); if (el) el.scrollBy({ left:-160, behavior:'smooth' }) }}
        style={{ flexShrink:0, width:32, height:32, borderRadius:'50%', border:'none',
          background:`linear-gradient(135deg,${color},${color}cc)`, color:'#fff',
          fontSize:18, cursor:'pointer', fontWeight:900, lineHeight:1 }}>‹</button>
      <div id={idPrefix} style={{ display:'flex', gap:6, overflowX:'auto', flex:1,
        paddingBottom:6, scrollbarWidth:'none' }}>
        {chips}
      </div>
      <button type="button"
        onClick={() => { const el = document.getElementById(idPrefix); if (el) el.scrollBy({ left:160, behavior:'smooth' }) }}
        style={{ flexShrink:0, width:32, height:32, borderRadius:'50%', border:'none',
          background:`linear-gradient(135deg,${color},${color}cc)`, color:'#fff',
          fontSize:18, cursor:'pointer', fontWeight:900, lineHeight:1 }}>›</button>
    </div>
  )
}
