// ============================================================
//  ConfirmationModals — prayer + satsang/bhadra/matri/savan
//  Handles every booking type with correct colors & details
// ============================================================
import React from 'react'
import { formatDateWithDay, formatDate, cleanTime } from '../../utils/utils.js'

// ── Per-type style config ──────────────────────────────────────
const TYPE_STYLE = {
  satsang: {
    emoji:'🪔', title:'Satsang Booked!', titleColor:'#78350f',
    cardBg:'#fef3c7', cardBorder:'rgba(217,119,6,0.3)',
    labelColor:'rgba(120,53,15,0.6)', valColor:'#78350f',
    jayguru:'Jayguru 🪔', jayguruColor:'#78350f', glow:'rgba(217,119,6,0.5)',
    shareBg:'#fffbeb', shareBorder:'rgba(217,119,6,0.25)', shareTitle:'#78350f',
    smsBg:'linear-gradient(135deg,#d97706,#fbbf24)', smsShadow:'rgba(217,119,6,0.35)',
    copyBg:'rgba(120,53,15,0.08)', copyColor:'#78350f',
    btnBg:'linear-gradient(135deg,#78350f,#d97706)',
  },
  bhadra: {
    emoji:'🌸', title:'Bhadra Parikrama Booked!', titleColor:'#5b21b6',
    cardBg:'rgba(245,243,255,0.95)', cardBorder:'rgba(124,58,237,0.3)',
    labelColor:'rgba(91,33,182,0.6)', valColor:'#5b21b6',
    jayguru:'Jayguru 🌸', jayguruColor:'#5b21b6', glow:'rgba(124,58,237,0.5)',
    shareBg:'rgba(245,243,255,0.8)', shareBorder:'rgba(124,58,237,0.25)', shareTitle:'#5b21b6',
    smsBg:'linear-gradient(135deg,#5b21b6,#7c3aed)', smsShadow:'rgba(124,58,237,0.35)',
    copyBg:'rgba(91,33,182,0.08)', copyColor:'#5b21b6',
    btnBg:'linear-gradient(135deg,#5b21b6,#7c3aed)',
  },
  matri: {
    emoji:'🌺', title:'Matri-Sammelan Booked!', titleColor:'#9d174d',
    cardBg:'rgba(253,242,248,0.95)', cardBorder:'rgba(219,39,119,0.3)',
    labelColor:'rgba(157,23,77,0.6)', valColor:'#9d174d',
    jayguru:'Jayguru 🌺', jayguruColor:'#9d174d', glow:'rgba(219,39,119,0.5)',
    shareBg:'rgba(253,242,248,0.8)', shareBorder:'rgba(219,39,119,0.25)', shareTitle:'#9d174d',
    smsBg:'linear-gradient(135deg,#9d174d,#db2777)', smsShadow:'rgba(219,39,119,0.35)',
    copyBg:'rgba(157,23,77,0.08)', copyColor:'#9d174d',
    btnBg:'linear-gradient(135deg,#9d174d,#db2777)',
  },
  savan: {
    emoji:'🌿', title:'Savan Parikrama Booked!', titleColor:'#14532d',
    cardBg:'rgba(240,253,244,0.95)', cardBorder:'rgba(22,163,74,0.3)',
    labelColor:'rgba(20,83,45,0.6)', valColor:'#14532d',
    jayguru:'Jayguru 🌿', jayguruColor:'#14532d', glow:'rgba(22,163,74,0.5)',
    shareBg:'rgba(240,253,244,0.8)', shareBorder:'rgba(22,163,74,0.25)', shareTitle:'#14532d',
    smsBg:'linear-gradient(135deg,#14532d,#16a34a)', smsShadow:'rgba(22,163,74,0.35)',
    copyBg:'rgba(20,83,45,0.08)', copyColor:'#14532d',
    btnBg:'linear-gradient(135deg,#14532d,#16a34a)',
  },
}

// ── Prayer confirmation modal ──────────────────────────────────
export function PrayerConfirmModal({ confirmation, onClose, buildShareMsg, buildShareMsgPlain, handleCopy }) {
  if (!confirmation) return null
  const c = confirmation
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:56, marginBottom:8, animation:'floatEmoji 2s ease-in-out infinite alternate' }}>🙏</div>
        <div className="modal-title">Booking Confirmed!</div>

        <div style={{ background:'#eff6ff', borderRadius:14, padding:'14px 16px',
          margin:'14px 0', textAlign:'left', border:'1px solid rgba(59,130,246,0.2)' }}>
          {[
            ['👤 Name',  c.name],
            [c.time==='Morning' ? '🌅 Slot' : '🌙 Slot', `${c.time} Prayer`],
            ['🗓️ Date',  formatDateWithDay(c.date)],
            ['🕐 Time',  cleanTime(c.prayerTime)],
          ].map(([label, val]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'5px 0', borderBottom:'1px solid rgba(59,130,246,0.08)' }}>
              <span style={{ fontSize:12, color:'rgba(29,78,216,0.55)', fontWeight:600 }}>{label}</span>
              <span style={{ fontSize:13, color:'#1e3a8a', fontWeight:700 }}>{val}</span>
            </div>
          ))}
        </div>

        <div className="modal-jayguru">Jayguru 🙏</div>

        <div style={{ marginTop:18, padding:'14px', background:'#f0fdf4', borderRadius:12, border:'1px solid #bbf7d0' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#065f46', marginBottom:10, textAlign:'center' }}>📤 Share Booking Details</div>
          <div style={{ display:'flex', flexDirection:'row', gap:8 }}>
            <a href={`https://wa.me/?text=${buildShareMsg(c)}`} target="_blank" rel="noopener noreferrer"
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                flexDirection:'column', gap:4, padding:'10px 6px',
                borderRadius:11, textDecoration:'none', background:'linear-gradient(135deg,#25D366,#128C7E)',
                color:'#fff', fontWeight:800, fontSize:12, boxShadow:'0 4px 14px rgba(37,211,102,0.35)' }}>
              <span style={{ fontSize:20 }}>💬</span>WhatsApp
            </a>
            <a href={`sms:${c.mobile}?body=${buildShareMsg(c)}`}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                flexDirection:'column', gap:4, padding:'10px 6px',
                borderRadius:11, textDecoration:'none', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                color:'#fff', fontWeight:800, fontSize:12, boxShadow:'0 4px 14px rgba(29,78,216,0.3)' }}>
              <span style={{ fontSize:20 }}>📱</span>SMS
            </a>
            <button onClick={() => handleCopy(c)}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                flexDirection:'column', gap:4, padding:'10px 6px',
                borderRadius:11, border:'none', background:'rgba(30,64,175,0.08)',
                cursor:'pointer', color:'#1e3a8a', fontWeight:700, fontSize:12 }}>
              <span style={{ fontSize:20 }}>📋</span>Copy
            </button>
          </div>
        </div>
        <button className="modal-close-btn" style={{ marginTop:14 }} onClick={onClose}>✓ Done</button>
      </div>
    </div>
  )
}

// ── Satsang / Bhadra / Matri / Savan confirmation modal ───────
export function SatsangConfirmModal({ satsangConfirm, onClose, buildSatsangShareMsg, buildSatsangShareMsgPlain, handleSatsangCopy }) {
  if (!satsangConfirm) return null
  const c  = satsangConfirm
  // _type is set by useSatsangBooking: 'satsang' | 'bhadra' | 'matri' | 'savan'
  const st = TYPE_STYLE[c._type] || TYPE_STYLE.satsang

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div style={{ fontSize:56, marginBottom:8,
          animation:'floatEmoji 2s ease-in-out infinite alternate',
          filter:`drop-shadow(0 0 18px ${st.glow})` }}>
          {st.emoji}
        </div>
        <div className="modal-title" style={{ color:st.titleColor }}>{st.title}</div>

        {/* Booking details */}
        <div style={{ background:st.cardBg, borderRadius:14, padding:'14px 16px',
          margin:'14px 0', textAlign:'left', border:`1px solid ${st.cardBorder}` }}>
          {[
            ['👤 Host',      c.name],
            ['📅 Date',      `${c.day ? c.day + ', ' : ''}${formatDate(c.date)}`],
            ['⏰ Time',      c.time ? c.time + ' onwards' : null],
            ['📍 Venue',     c.venue || null],
            ['🪔 Occasion',  c.occasion || null],
            ['🙏 Hosted By', c.hostedBy || null],
          ].map(([label, val]) => val ? (
            <div key={label} style={{ display:'flex', justifyContent:'space-between',
              alignItems:'flex-start', padding:'5px 0',
              borderBottom:`1px solid ${st.cardBorder.replace('0.3','0.1')}` }}>
              <span style={{ fontSize:12, color:st.labelColor, fontWeight:600 }}>{label}</span>
              <span style={{ fontSize:13, color:st.valColor, fontWeight:700,
                textAlign:'right', maxWidth:'65%' }}>{val}</span>
            </div>
          ) : null)}
        </div>

        <div style={{ fontFamily:"'Cinzel',serif", color:st.jayguruColor,
          fontSize:14, fontWeight:700, textAlign:'center', marginBottom:4 }}>
          {st.jayguru}
        </div>

        {/* Share section */}
        <div style={{ marginTop:14, padding:'14px', background:st.shareBg,
          borderRadius:12, border:`1px solid ${st.shareBorder}` }}>
          <div style={{ fontSize:12, fontWeight:700, color:st.shareTitle,
            marginBottom:10, textAlign:'center' }}>📤 Share Details</div>
          <div style={{ display:'flex', flexDirection:'row', gap:8 }}>
            <a href={`https://wa.me/?text=${buildSatsangShareMsg(c)}`} target="_blank" rel="noopener noreferrer"
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                flexDirection:'column', gap:4, padding:'10px 6px',
                borderRadius:11, textDecoration:'none', background:'linear-gradient(135deg,#25D366,#128C7E)',
                color:'#fff', fontWeight:800, fontSize:12, boxShadow:'0 4px 14px rgba(37,211,102,0.35)' }}>
              <span style={{ fontSize:20 }}>💬</span>WhatsApp
            </a>
            <a href={`sms:?body=${buildSatsangShareMsg(c)}`}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                flexDirection:'column', gap:4, padding:'10px 6px',
                borderRadius:11, textDecoration:'none', background:st.smsBg,
                color:'#fff', fontWeight:800, fontSize:12, boxShadow:`0 4px 14px ${st.smsShadow}` }}>
              <span style={{ fontSize:20 }}>📱</span>SMS
            </a>
            <button onClick={() => handleSatsangCopy(c)}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                flexDirection:'column', gap:4, padding:'10px 6px',
                borderRadius:11, border:'none', background:st.copyBg,
                cursor:'pointer', color:st.copyColor, fontWeight:700, fontSize:12 }}>
              <span style={{ fontSize:20 }}>📋</span>Copy
            </button>
          </div>
        </div>

        <button className="modal-close-btn"
          style={{ marginTop:14, background:st.btnBg }}
          onClick={onClose}>✓ Done</button>
      </div>
    </div>
  )
}
