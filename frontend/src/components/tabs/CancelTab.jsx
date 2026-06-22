// ============================================================
//  CancelTab — find and cancel bookings by mobile number
// ============================================================
import React from 'react'
import { SLOT_STYLE } from '../../config/prayerTimes.js'
import { getTodayStr, formatDateWithDay, cleanTime } from '../../utils/utils.js'

const TYPE_COLORS = { satsang:'#d97706', bhadra:'#7c3aed', matri:'#db2777', savan:'#16a34a' }
const TYPE_BG     = { satsang:'#fffbeb', bhadra:'rgba(245,243,255,0.9)', matri:'rgba(253,242,248,0.9)', savan:'rgba(240,253,244,0.9)' }
const TYPE_BORDER = { satsang:'rgba(217,119,6,0.25)', bhadra:'rgba(109,40,217,0.25)', matri:'rgba(190,24,93,0.25)', savan:'rgba(21,128,61,0.25)' }
const TYPE_BADGE  = { satsang:'🪔 Satsang', bhadra:'🌸 Bhadra', matri:'🌺 Matri', savan:'🌿 Savan' }
const TYPE_GRAD   = { satsang:'linear-gradient(135deg,#92400e,#d97706)', bhadra:'linear-gradient(135deg,#5b21b6,#7c3aed)', matri:'linear-gradient(135deg,#9d174d,#db2777)', savan:'linear-gradient(135deg,#14532d,#16a34a)' }
const TYPE_LABEL  = { satsang:'Cancel Satsang', bhadra:'Cancel Bhadra', matri:'Cancel Matri', savan:'Cancel Savan' }

export default function CancelTab({
  cancelMobile, setCancelMobile,
  cancelMsg, setCancelMsg,
  cancelResults, setCancelResults,
  showCancelPast, setShowCancelPast,
  cancelling,
  handleCancelLookup,
  handleCancelBooking,
  handleCancelSpecial,
}) {
  const todayStr = getTodayStr()

  const futureResults = (cancelResults || [])
    .filter(b => (b.date || '') >= todayStr)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const pastResults = (cancelResults || [])
    .filter(b => (b.date || '') < todayStr)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <div className="card">
      <div style={{ textAlign:'center', marginBottom:18 }}>
        <div style={{ fontFamily:"'Cinzel',serif", color:'#b91c1c', fontSize:17, fontWeight:700 }}>
          Cancel a Booking
        </div>
        <div style={{ color:'rgba(185,28,28,0.55)', fontSize:12, marginTop:4 }}>
          Enter your mobile number to find your bookings
        </div>
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(220,38,38,0.4),transparent)', marginTop:12 }}/>
      </div>

      {/* Mobile lookup */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <input className="divine-input"
          placeholder="Enter 10-digit mobile number"
          type="tel" maxLength="10"
          value={cancelMobile}
          style={{ borderColor:'rgba(220,38,38,0.3)', background:'#fff', flex:1 }}
          onChange={e => { setCancelMsg(''); setCancelResults(null); setCancelMobile(e.target.value.replace(/[^0-9]/g,'')) }}/>
        <button onClick={handleCancelLookup}
          style={{ padding:'12px 16px', border:'none', borderRadius:10,
            background:'#b91c1c', color:'#fff', fontWeight:700, fontSize:13,
            cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
          🔍 Find
        </button>
      </div>

      {/* Message */}
      {cancelMsg && (
        <div style={{ marginTop:4, padding:'10px 14px', borderRadius:9, fontSize:12,
          background: cancelMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2',
          border:`1px solid ${cancelMsg.startsWith('✅') ? '#6ee7b7':'#fca5a5'}`,
          color: cancelMsg.startsWith('✅') ? '#065f46':'#b91c1c' }}>
          {cancelMsg}
        </div>
      )}

      {/* Future results */}
      {futureResults.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12 }}>
          {futureResults.map(b => {
            const isPrayer = b._type === 'prayer' || !b._type
            if (isPrayer) {
              const c = SLOT_STYLE[b.time] || SLOT_STYLE['Morning']
              return (
                <div key={b.id} style={{ background:'#fff', borderRadius:12,
                  padding:'14px', border:'1px solid rgba(220,38,38,0.2)' }}>
                  <div style={{ marginBottom:4 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:'#1d4ed8',
                      background:'rgba(29,78,216,0.08)', padding:'2px 7px',
                      borderRadius:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>🙏 Prayer</span>
                  </div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:'#1e3a8a', fontSize:13 }}>{b.name}</div>
                  <div style={{ fontSize:12, color:c.color, fontWeight:700, marginTop:2 }}>
                    {c.icon} {b.time} Prayer · {formatDateWithDay(b.date)}
                  </div>
                  {b.prayerTime && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🕐 {cleanTime(b.prayerTime)}</div>}
                  <button disabled={cancelling === b.id} onClick={() => handleCancelBooking(b.id)}
                    style={{ marginTop:10, width:'100%', padding:'9px', border:'none', borderRadius:9,
                      background:'linear-gradient(135deg,#dc2626,#ef4444)',
                      color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                      opacity: cancelling === b.id ? 0.6 : 1 }}>
                    {cancelling === b.id ? '⏳ Cancelling...' : '🗑️ Cancel Booking'}
                  </button>
                </div>
              )
            }

            const color  = TYPE_COLORS[b._type]  || TYPE_COLORS.satsang
            const bg     = TYPE_BG[b._type]       || TYPE_BG.satsang
            const border = TYPE_BORDER[b._type]   || TYPE_BORDER.satsang
            const badge  = TYPE_BADGE[b._type]    || TYPE_BADGE.satsang
            const grad   = TYPE_GRAD[b._type]     || TYPE_GRAD.satsang
            const label  = TYPE_LABEL[b._type]    || 'Cancel'
            return (
              <div key={b.id} style={{ background:bg, borderRadius:12, padding:'14px', border:`1px solid ${border}` }}>
                <div style={{ marginBottom:4 }}>
                  <span style={{ fontSize:10, fontWeight:800, color,
                    background:border, padding:'2px 7px',
                    borderRadius:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>{badge}</span>
                </div>
                <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color, fontSize:13 }}>{b.name}</div>
                <div style={{ fontSize:12, color, fontWeight:700, marginTop:2 }}>
                  📅 {formatDateWithDay(b.date)} · ⏰ {cleanTime(b.time)}
                </div>
                {b.venue && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>📍 {b.venue}</div>}
                <button disabled={cancelling === b.id} onClick={() => handleCancelSpecial(b.id, b._type)}
                  style={{ marginTop:10, width:'100%', padding:'9px', border:'none', borderRadius:9,
                    background:grad, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                    opacity: cancelling === b.id ? 0.6 : 1 }}>
                  {cancelling === b.id ? '⏳ Cancelling...' : `🗑️ ${label}`}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Past bookings toggle */}
      {pastResults.length > 0 && (
        <div style={{ marginTop:12 }}>
          <button onClick={() => setShowCancelPast(p => !p)}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center',
              gap:8, padding:'10px 14px', borderRadius:10,
              border:'1px solid rgba(220,38,38,0.25)',
              background:'rgba(254,242,242,0.5)',
              color:'#b91c1c', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            <span>{showCancelPast ? '▲' : '▼'}</span>
            <span>{showCancelPast ? 'Hide Past Bookings' : `Show Past Bookings (${pastResults.length})`}</span>
          </button>
          {showCancelPast && (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8, opacity:0.75 }}>
              {pastResults.map(b => {
                const isPrayer = b._type === 'prayer' || !b._type
                if (isPrayer) {
                  const c = SLOT_STYLE[b.time] || SLOT_STYLE['Morning']
                  return (
                    <div key={b.id} style={{ background:'#f8fafc', borderRadius:12,
                      padding:'14px', border:'1px solid rgba(148,163,184,0.3)' }}>
                      <span style={{ fontSize:10, fontWeight:800, color:'#64748b',
                        background:'rgba(100,116,139,0.1)', padding:'2px 7px',
                        borderRadius:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>🙏 Prayer (Past)</span>
                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:'#475569', fontSize:13, marginTop:6 }}>{b.name}</div>
                      <div style={{ fontSize:12, color:'#64748b', fontWeight:700, marginTop:2 }}>
                        {c.icon} {b.time} Prayer · {formatDateWithDay(b.date)}
                      </div>
                      {b.prayerTime && <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>🕐 {cleanTime(b.prayerTime)}</div>}
                      <div style={{ marginTop:8, fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>✅ This prayer has already passed</div>
                    </div>
                  )
                }
                const color  = TYPE_COLORS[b._type] || TYPE_COLORS.satsang
                const bg     = TYPE_BG[b._type]     || TYPE_BG.satsang
                const border = TYPE_BORDER[b._type] || TYPE_BORDER.satsang
                const badge  = TYPE_BADGE[b._type]  || TYPE_BADGE.satsang
                return (
                  <div key={b.id} style={{ background:bg, borderRadius:12, padding:'14px', border:`1px solid ${border}` }}>
                    <span style={{ fontSize:10, fontWeight:800, color,
                      background:border, padding:'2px 7px',
                      borderRadius:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>{badge} (Past)</span>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color, fontSize:13, marginTop:6 }}>{b.name}</div>
                    <div style={{ fontSize:12, color, fontWeight:700, marginTop:2 }}>
                      📅 {formatDateWithDay(b.date)} · ⏰ {cleanTime(b.time)}
                    </div>
                    {b.venue && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>📍 {b.venue}</div>}
                    <div style={{ marginTop:8, fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>✅ This event has already passed</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {cancelResults && cancelResults.length === 0 && (
        <div style={{ textAlign:'center', padding:'16px 0', color:'rgba(153,27,27,0.5)', fontSize:13 }}>
          No bookings found for this number.
        </div>
      )}
    </div>
  )
}
